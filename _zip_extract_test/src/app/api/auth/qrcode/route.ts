import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
const uuidv4 = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

// 临时存储二维码状态（生产环境应使用Redis）
const qrCodeStore = new Map<
  string,
  {
    status: 'pending' | 'scanned' | 'confirmed' | 'expired';
    userId?: string;
    token?: string;
    createdAt: number;
  }
>();

// 清理过期二维码（5分钟）
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of qrCodeStore.entries()) {
    if (now - data.createdAt > 5 * 60 * 1000) {
      qrCodeStore.delete(code);
    }
  }
}, 60 * 1000);

// 生成二维码
export async function GET(request: NextRequest) {
  // 暂时取消扫码页面
  return NextResponse.json(
    { success: false, error: '扫码登录已暂时关闭' },
    { status: 503 }
  );

  /*
  try {
    const qrCode = uuidv4();
    
    // 存储二维码状态
    qrCodeStore.set(qrCode, {
      status: 'pending',
      createdAt: Date.now(),
    });

    // 生成二维码URL（指向Web端的扫码确认页面）
    // 优先使用环境变量
    const webUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const qrUrl = `${webUrl}/auth/qr-confirm?code=${qrCode}`;

    // 生成二维码图片URL（使用第三方服务或自己生成）
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      qrUrl
    )}`;

    return NextResponse.json({
      success: true,
      qrCode,
      qrUrl,
      qrImageUrl,
      expiresIn: 300, // 5分钟
    });
  } catch (error) {
    console.error('生成二维码错误:', error);
    return NextResponse.json(
      { success: false, error: '生成二维码失败' },
      { status: 500 }
    );
  }
  */
}

