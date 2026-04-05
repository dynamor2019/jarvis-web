// [CodeGuard Feature Index]
// - Admin user API supports split wallets and licenseType updates -> line 130
// [/CodeGuard Feature Index]

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { enqueueUserSyncTask } from '@/lib/userSyncQueue';

// 获取所有用户列表（管理员）
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // 构建查询条件
    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
        { name: { contains: search } },
      ];
    }

    // 查询用户
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          balance: true,
          tokenBalance: true,
          trafficTokenBalance: true,
          subscriptionTokenBalance: true,
          licenseType: true,
          subscriptionEnd: true,
          totalSpent: true,
          isActive: true,
          userType: true,
          age: true,
          gender: true,
          profession: true,
          industry: true,
          education: true,
          province: true,
          city: true,
          phone: true,
          tags: true,
          source: true,
          loginCount: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              transactions: true,
              usageRecords: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}


// PUT - 更新用户
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }
    const admin = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      userId, name, role, balance, tokenBalance, trafficTokenBalance, subscriptionTokenBalance, licenseType, subscriptionEnd, isActive,
      userType, age, gender, profession, industry, education,
      province, city, phone, tags, source, password
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        trafficTokenBalance: true,
        subscriptionTokenBalance: true,
        userType: true,
        licenseType: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    const hasTrafficUpdate = trafficTokenBalance !== undefined;
    const hasSubscriptionUpdate = subscriptionTokenBalance !== undefined;
    const nextTrafficBalance = hasTrafficUpdate ? Math.max(0, Number(trafficTokenBalance) || 0) : targetUser.trafficTokenBalance;
    const nextSubscriptionBalance = hasSubscriptionUpdate ? Math.max(0, Number(subscriptionTokenBalance) || 0) : targetUser.subscriptionTokenBalance;
    const derivedTokenBalance = nextTrafficBalance + nextSubscriptionBalance;

    const data: any = {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(balance !== undefined && { balance }),
      ...(tokenBalance !== undefined && !hasTrafficUpdate && !hasSubscriptionUpdate && { tokenBalance }),
      ...(hasTrafficUpdate && { trafficTokenBalance: nextTrafficBalance }),
      ...(hasSubscriptionUpdate && { subscriptionTokenBalance: nextSubscriptionBalance }),
      ...((hasTrafficUpdate || hasSubscriptionUpdate) && { tokenBalance: derivedTokenBalance }),
      ...(licenseType !== undefined && { licenseType }),
      ...(subscriptionEnd !== undefined && { subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : null }),
      ...(isActive !== undefined && { isActive }),
      ...(userType !== undefined && { userType }),
      ...(age !== undefined && { age: age ? parseInt(age) : null }),
      ...(gender !== undefined && { gender: gender || null }),
      ...(profession !== undefined && { profession: profession || null }),
      ...(industry !== undefined && { industry: industry || null }),
      ...(education !== undefined && { education: education || null }),
      ...(province !== undefined && { province: province || null }),
      ...(city !== undefined && { city: city || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(tags !== undefined && { tags: tags || null }),
      ...(source !== undefined && { source: source || null }),
      updatedAt: new Date(),
    };
    if (password && typeof password === 'string' && password.length >= 6) {
      const { hashPassword } = await import('@/lib/auth');
      data.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    const nextUserType = userType !== undefined ? userType : targetUser.userType;
    const nextLicenseType = licenseType !== undefined ? licenseType : targetUser.licenseType;
    const profileChanged = nextUserType !== targetUser.userType || nextLicenseType !== targetUser.licenseType;
    if (profileChanged) {
      await enqueueUserSyncTask(userId, 'USER_PROFILE_UPDATED', {
        userId,
        version: Date.now(),
        userType: nextUserType,
        licenseType: nextLicenseType,
        source: 'admin_panel',
        updatedBy: payload.userId,
      });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('更新用户失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - 删除用户
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }
    const admin = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

    // 删除用户相关数据
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.usageRecord.deleteMany({ where: { userId } });
    await prisma.featureRequest.deleteMany({ where: { userId } });
    await prisma.featureVote.deleteMany({ where: { userId } });
    await prisma.featureComment.deleteMany({ where: { userId } });

    // 删除用户
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: '用户已删除',
    });
  } catch (error: any) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
