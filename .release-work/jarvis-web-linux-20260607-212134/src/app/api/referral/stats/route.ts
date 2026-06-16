import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 获取推荐统计（含多推荐码列表）
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: '未授权' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token无效' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const referredUsers = await prisma.user.findMany({
      where: { referredBy: user.id },
      select: { id: true, username: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const rewardPerReferral = 10000;
    const totalReward = referredUsers.length * rewardPerReferral;

    let codes: Array<{ code: string; uses: number; maxUses: number; createdAt: Date; source?: string|null; note?: string|null }> = []
    let tableCodes: Array<{ code: string; uses: number; maxUses: number; createdAt: Date; source?: string|null; note?: string|null }> = []
    try {
      tableCodes = await prisma.referralCode.findMany({
        where: { creatorId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { code: true, uses: true, maxUses: true, createdAt: true, source: true, note: true },
      });
    } catch {
      tableCodes = []
    }
    codes = [...tableCodes]
    const legacy = (user as any).referralCode
    if (legacy) {
      const exists = codes.find(c => (c.code || '').trim() === (legacy || '').trim())
      if (!exists) {
        const maxUses = user.role === 'admin' ? 999999 : 1
        codes = [{ code: legacy, uses: referredUsers.length, maxUses, createdAt: user.createdAt }, ...codes]
      }
    }

    return NextResponse.json({
      success: true,
      codes,
      stats: { totalReferrals: referredUsers.length, totalReward, rewardPerReferral },
      referredUsers,
    });
  } catch (error) {
    console.error('获取推荐统计错误:', error);
    return NextResponse.json({ success: false, error: '获取统计失败' }, { status: 500 });
  }
}
