import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

// 获取使用记录
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const [records, total] = await Promise.all([
      prisma.usageRecord.findMany({
        where: { userId: payload.userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.usageRecord.count({
        where: { userId: payload.userId },
      }),
    ]);

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取使用记录错误:', error);
    return NextResponse.json(
      { error: '获取使用记录失败' },
      { status: 500 }
    );
  }
}

// 创建使用记录（消费）
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }

    const { model, tokens, cost, operation } = await request.json();

    // 获取用户当前余额
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    if (user.balance < cost) {
      return NextResponse.json(
        { error: '余额不足，请先充值' },
        { status: 400 }
      );
    }

    // 创建使用记录并扣费
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 创建使用记录
      const record = await tx.usageRecord.create({
        data: {
          userId: payload.userId,
          model,
          tokens,
          cost,
          operation,
        },
      });

      // 扣除余额
      const newBalance = user.balance - cost;
      const newTotalSpent = user.totalSpent + cost;

      await tx.user.update({
        where: { id: payload.userId },
        data: {
          balance: newBalance,
          totalSpent: newTotalSpent,
        },
      });

      // 创建消费交易记录
      await tx.transaction.create({
        data: {
          userId: payload.userId,
          type: 'consume',
          amount: -cost,
          balance: newBalance,
          description: `${operation} - ${model}`,
          status: 'completed',
        },
      });

      return { record, newBalance };
    });

    return NextResponse.json({
      message: '记录成功',
      ...result,
    });
  } catch (error) {
    console.error('创建使用记录错误:', error);
    return NextResponse.json(
      { error: '记录失败' },
      { status: 500 }
    );
  }
}
