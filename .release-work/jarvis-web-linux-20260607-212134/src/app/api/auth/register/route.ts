import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { verifyCode } from '@/lib/verificationStore';
import { getClientIp } from '@/lib/ip';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, name, referralCode, code } = await request.json();

    // 验证必填字段
    if (!email || !username || !password || !code) {
      return NextResponse.json(
        { error: '邮箱、用户名、密码和验证码为必填项' },
        { status: 400 }
      );
    }

    // 验证验证码
    
    const isValid = await verifyCode(email, code);
    
    if (!isValid) {
        return NextResponse.json(
            { error: '验证码无效或已过期' },
            { status: 400 }
        );
    }

    // 获取并检查注册IP
    const ip = getClientIp(request);
    
    // 如果不是本地环境且IP有效，则进行重复IP检查
    if (ip && ip !== 'unknown' && ip !== '127.0.0.1' && ip !== '::1') {
      const existingIpUser = await prisma.user.findFirst({
        where: { registrationIp: ip }
      });

      if (existingIpUser) {
        return NextResponse.json(
          { error: '该IP地址已注册过账号，请勿重复注册' },
          { status: 400 }
        );
      }
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '邮箱或用户名已被注册' },
        { status: 400 }
      );
    }

    // 查找推荐人（优先 ReferralCode 表，多码支持；兼容旧字段 user.referralCode）
    let referrerId: string | null = null;
    let matchedReferralCode: string | null = null;
    if (referralCode) {
      const raw = (referralCode || '').trim()
      const variants = Array.from(new Set([raw, raw.toUpperCase(), raw.toLowerCase()])).filter(Boolean)
      try {
        const code = await prisma.referralCode.findFirst({ where: { OR: variants.map(v => ({ code: v })) } });
        if (code) {
          const canUse = code.uses < code.maxUses;
          if (!canUse) {
            return NextResponse.json({ error: '推荐码已被使用' }, { status: 400 });
          }
          referrerId = code.creatorId;
          matchedReferralCode = code.code;
          await prisma.referralCode.update({
            where: { code: code.code },
            data: {
              uses: { increment: 1 },
              usedAt: new Date(),
            },
          });
        } else {
          const referrer = await prisma.user.findFirst({ where: { OR: variants.map(v => ({ referralCode: v })) } });
          if (referrer) {
            referrerId = referrer.id;
          } else {
            const parts = raw.split('-');
            if (parts.length >= 3) {
              const prefix = parts[0];
              const byName = await prisma.user.findFirst({ where: { OR: [prefix, prefix.toUpperCase(), prefix.toLowerCase()].map(v => ({ username: v })) } });
              const adminUser = !byName ? await prisma.user.findFirst({ where: { role: 'admin' } }) : null;
              const target = byName || (prefix.toUpperCase() === 'ADMIN' ? adminUser : null);
              if (target) {
                referrerId = target.id;
                matchedReferralCode = raw;
              }
            }
          }
        }
      } catch {
        const referrer = await prisma.user.findFirst({ where: { OR: variants.map(v => ({ referralCode: v })) } });
        if (referrer) {
          referrerId = referrer.id;
        } else {
          const parts = raw.split('-');
          if (parts.length >= 3) {
            const prefix = parts[0];
            const byName = await prisma.user.findFirst({ where: { OR: [prefix, prefix.toUpperCase(), prefix.toLowerCase()].map(v => ({ username: v })) } });
            const adminUser = !byName ? await prisma.user.findFirst({ where: { role: 'admin' } }) : null;
            const target = byName || (prefix.toUpperCase() === 'ADMIN' ? adminUser : null);
            if (target) {
              referrerId = target.id;
              matchedReferralCode = raw;
            }
          }
        }
      }
    }

    // 创建用户
    const hashedPassword = await hashPassword(password);
    const newUserTokens = 10000; // 新用户初始流量Token
    const referralBonus = 10000; // 推荐奖励Token（注册双方各+10000）
    
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name || username,
        trafficTokenBalance: newUserTokens + (referrerId ? referralBonus : 0), // 被推荐人注册即获推荐奖励
        subscriptionTokenBalance: 0,
        tokenBalance: newUserTokens + (referrerId ? referralBonus : 0),
        referredBy: referrerId,
        source: referrerId ? 'referral' : 'organic',
        registrationIp: ip !== 'unknown' ? ip : null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        balance: true,
        tokenBalance: true,
        trafficTokenBalance: true,
        subscriptionTokenBalance: true,
        createdAt: true,
      },
    });

    // 如果有推荐人，给推荐人发放奖励
    if (referrerId) {
      const refUser = await prisma.user.findUnique({
        where: { id: referrerId },
        select: { tokenBalance: true, trafficTokenBalance: true, subscriptionTokenBalance: true }
      });
      const refNewTrafficBal = (refUser?.trafficTokenBalance || 0) + referralBonus;
      const refNewBal = refNewTrafficBal + (refUser?.subscriptionTokenBalance || 0);
      const meNewBal = (user.tokenBalance || 0);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: referrerId },
          data: { trafficTokenBalance: refNewTrafficBal, tokenBalance: refNewBal }
        }),
        prisma.transaction.create({ data: { userId: referrerId, type: 'referral_reward', amount: 0, tokens: referralBonus, balance: 0, tokenBalance: refNewBal, description: `推荐新用户 ${username} 注册，获得 ${referralBonus} Token奖励` } }),
        prisma.transaction.create({ data: { userId: user.id, type: 'referral_reward', amount: 0, tokens: referralBonus, balance: 0, tokenBalance: meNewBal, description: `使用推荐码注册，获得 ${referralBonus} Token奖励` } }),
      ]);

      if (matchedReferralCode) {
        try {
          const code = await prisma.referralCode.findUnique({ where: { code: matchedReferralCode } });
          if (code && code.maxUses === 1) {
            await prisma.referralCode.update({
              where: { code: matchedReferralCode },
              data: { usedById: user.id, usedAt: new Date() },
            });
          }
        } catch {}
      }
    }

    // 生成 token
    const token = generateToken(user.id);

    return NextResponse.json({ message: '注册成功' + (referrerId ? '，已获得推荐奖励！' : ''), user, token, referralBonus: referrerId ? referralBonus : 0 });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
