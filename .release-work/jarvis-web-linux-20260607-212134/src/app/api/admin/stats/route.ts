import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 获取系统统计数据（管理员）
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }

    // 验证是否为管理员
    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 获取统计数据
    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      totalRevenue,
      totalUsage,
      featureUsageAgg,
      featureRanking,
      recentUsers,
    ] = await Promise.all([
      // 总用户数
      prisma.user.count(),
      
      // 活跃用户数（最近7天有使用记录）
      prisma.user.count({
        where: {
          usageRecords: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
      
      // 总交易数
      prisma.transaction.count(),
      
      // 总收入（充值金额）
      prisma.transaction.aggregate({
        where: { type: 'recharge' },
        _sum: { amount: true },
      }),
      
      // 总使用次数
      prisma.usageRecord.count(),
      prisma.userFeatureUsage.aggregate({
        _sum: { count: true },
      }),
      prisma.userFeatureUsage.groupBy({
        by: ['feature'],
        _sum: { count: true },
        orderBy: {
          _sum: { count: 'desc' },
        },
        take: 10,
      }),
      
      // 最近注册用户
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalTransactions,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalUsage,
        totalFeatureClicks: featureUsageAgg._sum.count || 0,
      },
      featureRanking: featureRanking.map((row) => ({
        feature: row.feature,
        total: row._sum.count || 0,
      })),
      recentUsers,
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
