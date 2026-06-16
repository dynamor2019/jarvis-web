import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const PROFILE_BONUS_TOKENS = 5000;

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未授权' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token 无效' }, { status: 401 });

    const body = await request.json();
    const { age, provinceCode, industryCode, majorCode } = body;

    if (typeof age !== 'number' || age < 18 || age > 65) {
      return NextResponse.json({ error: '年龄范围应为18-65' }, { status: 400 });
    }
    if (!provinceCode || !industryCode || !majorCode) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    const doc = await prisma.systemUserDoc.findFirst({ where: { userId: payload.userId } });
    if (!doc) return NextResponse.json({ error: '未找到用户档案' }, { status: 404 });

    const shouldGrantProfileBonus = !doc.profileComplete;
    const currentDoc: Record<string, unknown> =
      doc.doc && typeof doc.doc === 'string' ? (JSON.parse(doc.doc) as Record<string, unknown>) : {};
    const baseDoc = (currentDoc.base as Record<string, unknown> | undefined) || {};

    const mergedDoc: Record<string, unknown> = {
      ...currentDoc,
      base: { ...baseDoc, age, province: { code: provinceCode } },
      professional: { major: { code: majorCode } },
      industry: { code: industryCode },
      profile_complete: true,
      token_reward: shouldGrantProfileBonus ? PROFILE_BONUS_TOKENS : doc.tokenReward || 0,
      access_level: 'full',
    };

    const updated = await prisma.$transaction(async (tx) => {
      const updatedDoc = await tx.systemUserDoc.update({
        where: { id: doc.id },
        data: {
          age,
          provinceCode,
          industryCode,
          majorCode,
          profileComplete: true,
          tokenReward: shouldGrantProfileBonus ? PROFILE_BONUS_TOKENS : doc.tokenReward || 0,
          accessLevel: 'full',
          doc: JSON.stringify(mergedDoc),
        },
      });

      if (shouldGrantProfileBonus) {
        const user = await tx.user.findUnique({
          where: { id: payload.userId },
          select: { trafficTokenBalance: true, subscriptionTokenBalance: true },
        });

        if (user) {
          const nextTraffic = (user.trafficTokenBalance || 0) + PROFILE_BONUS_TOKENS;
          const nextToken = nextTraffic + (user.subscriptionTokenBalance || 0);

          await tx.user.update({
            where: { id: payload.userId },
            data: {
              trafficTokenBalance: nextTraffic,
              tokenBalance: nextToken,
            },
          });

          await tx.transaction.create({
            data: {
              userId: payload.userId,
              type: 'profile_complete_bonus',
              amount: 0,
              tokens: PROFILE_BONUS_TOKENS,
              balance: 0,
              tokenBalance: nextToken,
              description: `完善个人资料奖励 ${PROFILE_BONUS_TOKENS} Token`,
            },
          });
        }
      }

      return updatedDoc;
    });

    return NextResponse.json({
      ok: true,
      doc: updated,
      profileBonusGranted: shouldGrantProfileBonus ? PROFILE_BONUS_TOKENS : 0,
    });
  } catch (error: unknown) {
    console.error('完善资料错误:', error);
    const message = error instanceof Error ? error.message : '完善资料失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
