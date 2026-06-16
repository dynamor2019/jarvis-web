// [CodeGuard Feature Index]
// - resolveReferrer -> line 38
// - raw -> line 39
// - GET -> line 66
// - referralCode -> line 103
// - refNewTrafficBal -> line 166
// [/CodeGuard Feature Index]

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

declare global {
  var wechatTickets: Record<string, any> | undefined;
}

const JWT_SECRET = env.JWT_SECRET;
const WECHAT_INITIAL_TOKENS = 100000;
const WECHAT_REFERRAL_BONUS = 5000;

async function resolveReferrer(referralCode: string): Promise<{ referrerId: string | null; matchedCode: string | null }> {
  const raw = (referralCode || '').trim();
  if (!raw) return { referrerId: null, matchedCode: null };

  const variants = Array.from(new Set([raw, raw.toUpperCase(), raw.toLowerCase()])).filter(Boolean);
  try {
    const code = await prisma.referralCode.findFirst({
      where: { OR: variants.map((v) => ({ code: v })) },
    });
    if (code && code.uses < code.maxUses) {
      return { referrerId: code.creatorId, matchedCode: code.code };
    }
  } catch {}

  try {
    const referrer = await prisma.user.findFirst({
      where: { OR: variants.map((v) => ({ referralCode: v })) },
      select: { id: true },
    });
    if (referrer) {
      return { referrerId: referrer.id, matchedCode: null };
    }
  } catch {}

  return { referrerId: null, matchedCode: null };
}

// 婵☆偀鍋撻柡灞诲劚娴滄洘绌遍敍鍕仮鐟滅増娲滄慨鎼佸箑?
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticket = searchParams.get('ticket');
    const redirectMode = searchParams.get('redirect') === '1';
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'missing_ticket' },
        { status: 400 }
      );
    }
    
    // 婵☆偀鍋撻柡宀婃icket闁绘鍩栭埀?
    const tickets = globalThis.wechatTickets || {};
    const ticketData = tickets[ticket];
    
    if (!ticketData) {
      return NextResponse.json({
        success: false,
        status: 'expired',
        message: 'ticket_expired',
      });
    }
    
    // 婵☆偀鍋撻柡灞诲劜濡叉悂宕ラ敃鈧崙鈩冩交閸ャ劍鍩?
    if (Date.now() > ticketData.expiresAt) {
      delete tickets[ticket];
      return NextResponse.json({
        success: false,
        status: 'expired',
        message: 'ticket_expired',
      });
    }
    
    // 婵☆偀鍋撻柡灞诲劜濡叉悂宕ラ敃鈧崙锟犲箥椤愩倗鍨虫鐐跺煐瀹稿潡寮?
    if (ticketData.status === 'success' && ticketData.userInfo) {
      let isNewUser = false;
      let referralBonusGranted = 0;
      const referralCode = (ticketData.referralCode || '').trim();
      const matchedReferrer = await resolveReferrer(referralCode);

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: ticketData.userInfo.email },
            { username: ticketData.userInfo.username },
          ],
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          role: true,
          balance: true,
          tokenBalance: true,
          trafficTokenBalance: true,
          subscriptionTokenBalance: true,
          isActive: true,
        },
      });

      let user;
      if (existingUser) {
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: ticketData.userInfo.name,
            avatar: ticketData.userInfo.avatar,
            updatedAt: new Date(),
          },
        });
      } else {
        isNewUser = true;
        const inviteeBonus = matchedReferrer.referrerId ? WECHAT_REFERRAL_BONUS : 0;
        referralBonusGranted = inviteeBonus;

        user = await prisma.user.create({
          data: {
            email: ticketData.userInfo.email,
            username: ticketData.userInfo.username,
            password: 'wechat_login',
            name: ticketData.userInfo.name,
            avatar: ticketData.userInfo.avatar,
            role: 'user',
            balance: 0,
            trafficTokenBalance: WECHAT_INITIAL_TOKENS + inviteeBonus,
            subscriptionTokenBalance: 0,
            tokenBalance: WECHAT_INITIAL_TOKENS + inviteeBonus,
            isActive: true,
            referredBy: matchedReferrer.referrerId || null,
            source: matchedReferrer.referrerId ? 'referral' : 'organic',
          },
        });

        if (matchedReferrer.referrerId && matchedReferrer.referrerId !== user.id) {
          const refUser = await prisma.user.findUnique({
            where: { id: matchedReferrer.referrerId },
            select: { trafficTokenBalance: true, subscriptionTokenBalance: true },
          });
          const refNewTrafficBal = (refUser?.trafficTokenBalance || 0) + WECHAT_REFERRAL_BONUS;
          const refNewTokenBal = refNewTrafficBal + (refUser?.subscriptionTokenBalance || 0);
          const meTokenBal = user.tokenBalance || WECHAT_INITIAL_TOKENS + inviteeBonus;

          await prisma.$transaction([
            prisma.user.update({
              where: { id: matchedReferrer.referrerId },
              data: {
                trafficTokenBalance: refNewTrafficBal,
                tokenBalance: refNewTokenBal,
              },
            }),
            prisma.transaction.create({
              data: {
                userId: matchedReferrer.referrerId,
                type: 'referral_reward',
                amount: 0,
                tokens: WECHAT_REFERRAL_BONUS,
                balance: 0,
                tokenBalance: refNewTokenBal,
                description: `wechat referral reward for ${user.username}: +${WECHAT_REFERRAL_BONUS} Token`,
              },
            }),
            prisma.transaction.create({
              data: {
                userId: user.id,
                type: 'referral_reward',
                amount: 0,
                tokens: WECHAT_REFERRAL_BONUS,
                balance: 0,
                tokenBalance: meTokenBal,
                description: `wechat invitee reward: +${WECHAT_REFERRAL_BONUS} Token`,
              },
            }),
          ]);

          if (matchedReferrer.matchedCode) {
            try {
              const code = await prisma.referralCode.findUnique({ where: { code: matchedReferrer.matchedCode } });
              if (code && code.uses < code.maxUses) {
                await prisma.referralCode.update({
                  where: { code: matchedReferrer.matchedCode },
                  data: {
                    uses: { increment: 1 },
                    usedAt: new Date(),
                    ...(code.maxUses === 1 ? { usedById: user.id } : {}),
                  },
                });
              }
            } catch {}
          }
        }
      }
      
      // 闁汇垻鍠愰崹娆絎T token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          username: user.username,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      });
      
      // 婵炴挸鎳愰幃濡昳cket
      delete tickets[ticket];
      
      
      
      if (redirectMode) {
        return NextResponse.redirect(
          new URL(`/login?wechat=success&token=${encodeURIComponent(token)}`, process.env.NEXT_PUBLIC_BASE_URL || request.url)
        );
      }

      return NextResponse.json({
        success: true,
        status: 'success',
        isNewUser,
        referralBonusGranted,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          balance: user.balance,
          tokenBalance: user.tokenBalance,
        },
        token,
      });
    }
    
    if (redirectMode) {
      return NextResponse.redirect(
        new URL('/login?error=wechat_pending', process.env.NEXT_PUBLIC_BASE_URL || request.url)
      );
    }

    return NextResponse.json({
      success: true,
      status: ticketData.status,
      message: ticketData.status === 'pending' ? 'waiting_for_scan' : 'scan_failed',
    });
  } catch (error: unknown) {
    console.error('婵☆偀鍋撻柡灞诲劚娴滄洘绌遍敍鍕仮鐟滅増娲滄慨鎼佸箑娴ｆ悶浜奸悹?', error);
    const message = error instanceof Error ? error.message : 'server_error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
