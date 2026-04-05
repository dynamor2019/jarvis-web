import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取 token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 验证 token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token 无效或已过期' },
        { status: 401 }
      );
    }

    // 获取用户信息
    let user: any = null
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          tokenBalance: true,
          trafficTokenBalance: true,
          subscriptionTokenBalance: true,
          balance: true,
          totalSpent: true,
          school: true,
          country: true,
          referralCode: true,
          referredBy: true,
          createdAt: true,
        },
      });
    } catch {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          tokenBalance: true,
          trafficTokenBalance: true,
          subscriptionTokenBalance: true,
          balance: true,
          totalSpent: true,
          school: true,
          country: true,
          referredBy: true,
          createdAt: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token 无效或已过期' }, { status: 401 });
    }

    const body = await request.json();
    const allowed: any = {};
    const nextEmail =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if ('email' in body) {
      if (!nextEmail) {
        return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
      }
      allowed.email = nextEmail;
    }
    if ('name' in body) allowed.name = body.name ?? null;
    if ('avatar' in body) allowed.avatar = body.avatar ?? null;
    if ('phone' in body) allowed.phone = body.phone ?? null;
    if ('preferredLanguage' in body) allowed.preferredLanguage = body.preferredLanguage ?? 'zh-CN';
    if ('timezone' in body) allowed.timezone = body.timezone ?? 'Asia/Shanghai';
    if ('province' in body) allowed.province = body.province ?? null;
    if ('city' in body) allowed.city = body.city ?? null;
    if ('age' in body) allowed.age = body.age === null || body.age === undefined ? null : parseInt(body.age);
    if ('gender' in body) allowed.gender = body.gender ?? null;
    if ('profession' in body) allowed.profession = body.profession ?? null;
    if ('industry' in body) allowed.industry = body.industry ?? null;
    if ('education' in body) allowed.education = body.education ?? null;
    if ('school' in body) allowed.school = body.school ?? null;
    if ('country' in body) allowed.country = body.country ?? null;
    if ('tags' in body) allowed.tags = body.tags ?? null;

    const prev = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true, name: true, phone: true, preferredLanguage: true, timezone: true, province: true, city: true, country: true } });
    if (!prev) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    if ('email' in body && nextEmail && nextEmail !== (prev.email || '').toLowerCase()) {
      const emailOwner = await prisma.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      });
      if (emailOwner && emailOwner.id !== payload.userId) {
        return NextResponse.json({ error: '该邮箱已被使用' }, { status: 409 });
      }
    }
    const updated = await prisma.user.update({
      where: { id: payload.userId },
      data: allowed,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        phone: true,
        role: true,
        licenseType: true,
        subscriptionEnd: true,
        preferredLanguage: true,
        timezone: true,
        age: true,
        gender: true,
        profession: true,
        industry: true,
        education: true,
        school: true,
        country: true,
        province: true,
        city: true,
      },
    });

    try {
      const already = await prisma.transaction.count({ where: { userId: payload.userId, type: 'profile_bonus' } });
      const wasComplete = !!(prev?.name) && (!!(prev?.phone) || (!!(prev?.province) && !!(prev?.city))) && !!(prev?.preferredLanguage) && !!(prev?.timezone);
      const meets = !!(updated.name) && (!!(updated.phone) || (!!(updated.province) && !!(updated.city))) && !!(updated.preferredLanguage) && !!(updated.timezone);
      if (!already && meets) {
        const userNow = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { tokenBalance: true, trafficTokenBalance: true, subscriptionTokenBalance: true }
        });
        const bonus = 5000;
        if (!wasComplete) {
          const newTraffic = (userNow?.trafficTokenBalance || 0) + bonus;
          const newBal = newTraffic + (userNow?.subscriptionTokenBalance || 0);
          await prisma.$transaction([
            prisma.user.update({ where: { id: payload.userId }, data: { trafficTokenBalance: newTraffic, tokenBalance: newBal } }),
            prisma.transaction.create({ data: { userId: payload.userId, type: 'profile_bonus', amount: 0, tokens: bonus, balance: 0, tokenBalance: newBal, description: '完善个人信息奖励' } }),
          ]);
        }
      }
    } catch {}

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    return NextResponse.json({ error: '保存失败，请稍后重试' }, { status: 500 });
  }
}
