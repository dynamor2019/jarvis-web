import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - 获取所有需求（管理员）
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
       return NextResponse.json({ success: false, error: '无效的令牌' }, { status: 401 });
    }

    // 验证管理员权限
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [requests, total] = await Promise.all([
      prisma.featureRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
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
  } catch (error: any) {
    console.error('获取需求列表失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - 更新需求状态
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
       return NextResponse.json({ success: false, error: '无效的令牌' }, { status: 401 });
    }

    // 验证管理员权限
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, status, adminNote } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.featureRequest.update({
      where: { id: requestId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error: any) {
    console.error('更新需求状态失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - 删除需求
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
       return NextResponse.json({ success: false, error: '无效的令牌' }, { status: 401 });
    }

    // 验证管理员权限
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: '缺少需求ID' },
        { status: 400 }
      );
    }

    await prisma.featureRequest.delete({
      where: { id: requestId },
    });

    return NextResponse.json({
      success: true,
      message: '需求已删除',
    });
  } catch (error: any) {
    console.error('删除需求失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}