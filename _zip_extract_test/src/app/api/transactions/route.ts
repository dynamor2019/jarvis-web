import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');

    // 构建查询条件
    const where: Prisma.TransactionWhereInput = { userId: payload.userId };
    if (type) {
      where.type = type;
    }

    // 查询交易记录
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取交易记录错误:', error);
    return NextResponse.json(
      { error: '获取交易记录失败' },
      { status: 500 }
    );
  }
}

// 创建交易记录（充值）
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

    const { amount, paymentMethod, description } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: '充值金额必须大于0' },
        { status: 400 }
      );
    }

    // 获取用户当前余额
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 创建交易记录并更新余额
    const transaction = await prisma.$transaction(async (tx) => {
      const newBalance = user.balance + amount;

      // 创建交易记录
      const trans = await tx.transaction.create({
        data: {
          userId: payload.userId,
          type: 'recharge',
          amount,
          balance: newBalance,
          description: description || '账户充值',
          paymentMethod,
          status: 'completed',
        },
      });

      // 更新用户余额
      await tx.user.update({
        where: { id: payload.userId },
        data: { balance: newBalance },
      });

      return trans;
    });

    return NextResponse.json({
      message: '充值成功',
      transaction,
    });
  } catch (error) {
    console.error('创建交易记录错误:', error);
    return NextResponse.json(
      { error: '充值失败' },
      { status: 500 }
    );
  }
}
