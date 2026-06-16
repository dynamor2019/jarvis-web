import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const qrCodeStore = (global as any).qrCodeStore || new Map();
(global as any).qrCodeStore = qrCodeStore;

// 确认二维码登录
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!code) {
      return NextResponse.json(
        { success: false, error: '缺少二维码' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      );
    }

    // 验证用户token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token无效' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查二维码是否存在
    const qrData = qrCodeStore.get(code);
    if (!qrData) {
      return NextResponse.json(
        { success: false, error: '二维码不存在或已过期' },
        { status: 404 }
      );
    }

    // 更新二维码状态为已确认
    qrData.status = 'confirmed';
    qrData.userId = user.id;
    qrData.token = token;
    qrData.username = user.username;
    qrCodeStore.set(code, qrData);

    return NextResponse.json({
      success: true,
      message: '登录确认成功',
    });
  } catch (error) {
    console.error('确认二维码登录错误:', error);
    return NextResponse.json(
      { success: false, error: '确认失败' },
      { status: 500 }
    );
  }
}

// 扫描二维码（标记为已扫描）
export async function PUT(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: '缺少二维码' },
        { status: 400 }
      );
    }

    const qrData = qrCodeStore.get(code);
    if (!qrData) {
      return NextResponse.json(
        { success: false, error: '二维码不存在或已过期' },
        { status: 404 }
      );
    }

    // 更新状态为已扫描
    qrData.status = 'scanned';
    qrCodeStore.set(code, qrData);

    return NextResponse.json({
      success: true,
      message: '已标记为扫描',
    });
  } catch (error) {
    console.error('标记扫描错误:', error);
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    );
  }
}
