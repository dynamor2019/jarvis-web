import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - 获取功能请求列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'community' 或 'premium'
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'hot'; // 'hot', 'new', 'bounty'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Prisma.FeatureRequestWhereInput = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (category) where.category = category;

    // 排序逻辑
    let orderBy: Prisma.FeatureRequestOrderByWithRelationInput = {};
    if (sortBy === 'hot') {
      orderBy = { upvotes: 'desc' };
    } else if (sortBy === 'bounty') {
      orderBy = { bounty: 'desc' };
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const [requests, total] = await Promise.all([
      prisma.featureRequest.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.featureRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('获取功能请求失败:', error);
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST - 创建功能请求
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, description, category, bounty } = body;

    // 从 token 验证获取真实用户ID
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: '无效的访问令牌' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 验证必填字段
    if (!type || !title || !description || !category) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证类型
    if (!['community', 'premium'].includes(type)) {
      return NextResponse.json(
        { success: false, error: '无效的请求类型' },
        { status: 400 }
      );
    }

    // 如果是高级定制，验证悬赏金额
    if (type === 'premium') {
      if (!bounty || bounty < 100) {
        return NextResponse.json(
          { success: false, error: '高级定制悬赏金额不能低于100元' },
          { status: 400 }
        );
      }

      // 检查用户余额
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });

      if (!user || user.balance < bounty) {
        return NextResponse.json(
          { success: false, error: '余额不足' },
          { status: 400 }
        );
      }
    }

    // 创建功能请求
    const featureRequest = await prisma.featureRequest.create({
      data: {
        userId,
        type,
        title,
        description,
        category,
        bounty: type === 'premium' ? bounty : 0,
        isPaid: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // 如果是高级定制，冻结用户余额
    if (type === 'premium' && bounty > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: bounty,
          },
        },
      });

      // 创建交易记录
      await prisma.transaction.create({
        data: {
          userId,
          type: 'consume',
          amount: -bounty,
          balance: 0, // 需要重新查询
          description: `高级定制悬赏：${title}`,
          paymentMethod: 'balance',
          status: 'completed',
        },
      });
    }

    return NextResponse.json({
      success: true,
      request: featureRequest,
    });
  } catch (error: unknown) {
    console.error('创建功能请求失败:', error);
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
