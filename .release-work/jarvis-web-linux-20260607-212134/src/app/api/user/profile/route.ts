// [CodeGuard Feature Index]
// - GET -> line 11
// - PUT -> line 94
// - newTraffic -> line 230
// [/CodeGuard Feature Index]

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token is invalid' }, { status: 401 });
    }

    // Use tiered selects so older DB schemas don't fail with 500 when newer columns are missing.
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          role: true,
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
      try {
        user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
            role: true,
            tokenBalance: true,
            balance: true,
            totalSpent: true,
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
            balance: true,
            createdAt: true,
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const normalizedUser = {
      ...user,
      role: user.role ?? 'user',
      tokenBalance: user.tokenBalance ?? 0,
      trafficTokenBalance: user.trafficTokenBalance ?? 0,
      subscriptionTokenBalance: user.subscriptionTokenBalance ?? 0,
      totalSpent: user.totalSpent ?? 0,
      school: user.school ?? null,
      country: user.country ?? null,
      referralCode: user.referralCode ?? null,
      referredBy: user.referredBy ?? null,
    };

    return NextResponse.json({ user: normalizedUser });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token is invalid' }, { status: 401 });
    }

    const body = await request.json();
    const allowed: any = {};
    const nextEmail =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if ('email' in body) {
      if (!nextEmail) {
        return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
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

    const prev = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        email: true,
        name: true,
        phone: true,
        preferredLanguage: true,
        timezone: true,
        province: true,
        city: true,
        country: true,
        password: true,
      },
    });
    if (!prev) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if ('password' in body) {
      const nextPassword = typeof body.password === 'string' ? body.password.trim() : '';
      if (!nextPassword) {
        return NextResponse.json({ error: 'New password is required' }, { status: 400 });
      }
      if (nextPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      const currentPassword =
        typeof body.currentPassword === 'string' ? body.currentPassword.trim() : '';
      const savedPassword = typeof prev.password === 'string' ? prev.password : '';
      const isSocialPlaceholder =
        savedPassword === 'wechat_login' || savedPassword === 'alipay_login' || !savedPassword;
      const isHashedPassword = savedPassword.startsWith('$2');

      if (isHashedPassword && !isSocialPlaceholder) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
        }
        const isValid = await verifyPassword(currentPassword, savedPassword);
        if (!isValid) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
      }

      allowed.password = await hashPassword(nextPassword);
    }

    if ('email' in body && nextEmail && nextEmail !== (prev.email || '').toLowerCase()) {
      const emailOwner = await prisma.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      });
      if (emailOwner && emailOwner.id !== payload.userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
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
            prisma.transaction.create({ data: { userId: payload.userId, type: 'profile_bonus', amount: 0, tokens: bonus, balance: 0, tokenBalance: newBal, description: `Profile completion bonus: +${bonus} Token` } }),
          ]);
        }
      }
    } catch {}

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('闂備礁鎼ú銈夋偤閵娾晛钃熷┑鐘叉处閸嬨劑鏌曟繝蹇曠暠闁绘挻娲栬彁闁搞儻绲芥晶鎻捗归悡搴㈠殗闁哄被鍔岄埢搴ㄥ箳濠靛棙顔€:', error);
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
  }
}
