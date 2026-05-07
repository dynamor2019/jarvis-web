import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emailInput = (body?.email ?? '').trim();
    const usernameInput = (body?.username ?? '').trim();
    const password = (body?.password ?? '').trim();
    const identifier = emailInput || usernameInput;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: '邮箱/用户名和密码为必填项' },
        { status: 400 }
      );
    }

    // 查找用户（支持邮箱或用户名登录）
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '邮箱/用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: '邮箱/用户名或密码错误' },
        { status: 401 }
      );
    }

    // 生成 token
    const token = generateToken(user.id);

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: '登录成功',
      user: {
        ...userWithoutPassword,
        role: user.role, // 确保返回角色信息
      },
      token,
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
