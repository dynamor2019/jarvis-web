import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getPaymentConfig, getSystemConfig } from '@/lib/config';

declare global {
  var alipayTickets: Record<string, any> | undefined;
}

// 全局存储ticket（生产环境应使用Redis）
if (!globalThis.alipayTickets) {
  globalThis.alipayTickets = {};
}

// 生成支付宝登录二维码
export async function GET(request: NextRequest) {
  try {
    // 生成唯一ticket
    const ticket = `alipay_ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 存储ticket状态
    globalThis.alipayTickets![ticket] = {
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
    
    // 开发环境：生成模拟登录链接
    const isLocal = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';
    const paymentConfig = await getPaymentConfig();
    const alipayAppId = paymentConfig.alipay.appId || process.env.ALIPAY_APP_ID || '';
    const isDev = !alipayAppId;
    const origin = request.nextUrl.origin;
    // 优先使用环境变量
    const forwardedProto = (request.headers.get('x-forwarded-proto') || '').split(',')[0].trim();
    const forwardedHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(',')[0].trim();
    const configuredBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
    const inferredBaseUrl = forwardedHost
      ? `${forwardedProto || 'https'}://${forwardedHost}`.replace(/\/+$/, '')
      : origin.replace(/\/+$/, '');
    const baseUrl = isLocal ? origin : (configuredBaseUrl || inferredBaseUrl || origin.replace(/\/+$/, ''));
    const configuredAlipayRedirectUri =
      ((await getSystemConfig('alipay_login_redirect_uri')) || process.env.ALIPAY_LOGIN_REDIRECT_URI || '')
        .trim();
    const fallbackAlipayRedirectUri = 'https://www.jarvisai.com.cn/api/auth/alipay/callback';
    const normalizedRedirectUri = (configuredAlipayRedirectUri || `${baseUrl}/api/auth/alipay/callback` || fallbackAlipayRedirectUri)
      .replace(/^http:\/\//i, 'https://')
      .replace(/\/+$/, '');
    
    let qrContent;
    if (isDev) {
      // 开发环境：指向确认登录页面
      qrContent = `${baseUrl}/api/auth/alipay/confirm?ticket=${ticket}`;
    } else {
      // 生产环境：支付宝开放平台登录URL
      const appId = alipayAppId.trim();
      const redirectUri = encodeURIComponent(normalizedRedirectUri || fallbackAlipayRedirectUri);
      qrContent = `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=${appId}&scope=auth_user&redirect_uri=${redirectUri}&state=${ticket}`;
    }
    
    // 生成二维码
    const qrCode = await QRCode.toDataURL(qrContent, {
      width: 300,
      margin: 2,
    });
    
    return NextResponse.json({
      success: true,
      qrCode,
      ticket,
      dev: isDev,
      authUrl: !isDev ? qrContent : undefined,
      expiresIn: 300, // 5分钟
    });
  } catch (error: unknown) {
    console.error('生成支付宝二维码失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
