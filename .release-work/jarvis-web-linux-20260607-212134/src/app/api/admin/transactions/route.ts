// Policy: Do not modify directly. Explain reason before edits. Last confirm reason: 用户确认本地与服务器交易记录排序页面可用

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }

    // 验证是否为管理员
    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const search = searchParams.get('search'); // 可搜索用户名或邮箱

    // 构建查询条件
    const where: any = {};
    
    if (type) {
      where.type = type;
    }

    if (search) {
      where.user = {
        OR: [
          { username: { contains: search } },
          { email: { contains: search } },
          { name: { contains: search } },
        ]
      };
    }

    const [transactions, paidOrders] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
            user: {
                select: {
                    username: true,
                    email: true,
                    name: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
      type && type !== 'recharge'
        ? Promise.resolve([])
        : prisma.order.findMany({
            where: {
              status: 'paid',
              ...(search
                ? {
                    user: {
                      OR: [
                        { username: { contains: search } },
                        { email: { contains: search } },
                        { name: { contains: search } },
                      ],
                    },
                  }
                : {}),
            },
            include: {
              user: {
                select: {
                  username: true,
                  email: true,
                  name: true,
                },
              },
            },
            orderBy: [{ paymentTime: 'desc' }, { updatedAt: 'desc' }],
            take: 300,
          }),
    ]);

    const orderTransactions = paidOrders
      .filter((order) => !transactions.some((tx) => tx.description.includes(order.orderNo)))
      .map((order) => ({
        id: `order-${order.orderNo}`,
        userId: order.userId,
        type: 'recharge',
        amount: order.amount,
        tokens: order.tokens,
        balance: 0,
        tokenBalance: null,
        description: `充值${order.productName}（订单 ${order.orderNo}）`,
        paymentMethod: order.paymentMethod || 'alipay',
        status: 'completed',
        createdAt: order.paymentTime || order.updatedAt || order.createdAt,
        user: order.user,
      }));

    const allTransactions = [...orderTransactions, ...transactions].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const total = allTransactions.length;
    const pagedTransactions = allTransactions.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      transactions: pagedTransactions,
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
