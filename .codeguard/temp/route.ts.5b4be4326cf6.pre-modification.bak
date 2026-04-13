import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import os from 'os';
import { getSystemConfig } from '@/lib/config';

declare global {
  var wechatTickets: Record<string, any> | undefined;
}

// 全局存储ticket（生产环境应使用Redis）
if (!globalThis.wechatTickets) {
  globalThis.wechatTickets = {};
}

function isLocalHost(host: string): boolean {
  const h = (host || '').trim().toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

function resolveLanIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const addrs = nets[name] || [];
    for (const addr of addrs) {
      const family = typeof addr.family === 'string' ? addr.family : String(addr.family);
      if (family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  return '127.0.0.1';
}

// 生成微信登录二维码
export async function GET(request: NextRequest) {
  try {
    // 生成唯一ticket
    const ticket = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const referralCode = (request.nextUrl.searchParams.get('referralCode') || '').trim();
    
    // 存储ticket状态
    globalThis.wechatTickets![ticket] = {
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
      referralCode: referralCode || undefined,
    };
    
    // 检查是否配置了微信 AppID 和 AppSecret
    // 优先使用覆盖配置，解决 .env.local 无法修改的问题
    const appId =
      (await getSystemConfig('wechat_app_id')) ||
      process.env.WECHAT_APP_ID_OVERRIDE ||
      process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;
    
    // 只有同时配置了 AppID 和 Secret，且不是默认值，才启用生产模式
    const isConfigured = appId && appId !== 'your-wechat-app-id' && appSecret && appSecret !== 'your-wechat-app-secret';
    // 在开发环境且是本地运行时，优先使用开发模式（模拟登录），除非显式禁用
    const runtimeHost = request.nextUrl.hostname || '';
    const rawForwardedHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
      .split(',')[0]
      .trim();
    const forwardedHostOnly = rawForwardedHost.split(':')[0].trim();
    const isLocal = isLocalHost(forwardedHostOnly || runtimeHost);
    const isDev = isLocal || !isConfigured;
    
    const origin = request.nextUrl.origin;
    // 优先使用环境变量中配置的 BASE_URL，如果在本地开发且未配置，则回退到 origin
    // 注意：扫码登录需要手机能访问该地址，因此 localhost 在手机上无法访问
    const forwardedProto = (request.headers.get('x-forwarded-proto') || '').split(',')[0].trim();
    const forwardedHost = rawForwardedHost;
    const configuredBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
    const configuredWechatRedirectUri =
      ((await getSystemConfig('wechat_login_redirect_uri')) || process.env.WECHAT_LOGIN_REDIRECT_URI || '')
        .trim();
    const normalizedOrigin = origin.replace(/\/+$/, '');
    const inferredBaseUrl = forwardedHost
      ? `${forwardedProto || 'https'}://${forwardedHost}`.replace(/\/+$/, '')
      : normalizedOrigin;
    const runtimeBaseUrl = inferredBaseUrl || normalizedOrigin;
    const requestPort = request.nextUrl.port || '3010';
    const lanBaseUrl = `http://${resolveLanIp()}:${requestPort}`;
    const forcedDevBaseUrl = (process.env.WECHAT_DEV_BASE_URL || '').trim().replace(/\/+$/, '');
    const devBaseUrl = isLocal
      ? (forcedDevBaseUrl || lanBaseUrl)
      : (configuredBaseUrl || runtimeBaseUrl);
    const normalizeUrl = (raw: string) => raw.trim().replace(/\/+$/, '');
    const forceHttps = (raw: string) => raw.replace(/^http:\/\//i, 'https://');
    const fallbackWechatRedirectUri = 'https://www.jarvisai.com.cn/api/auth/wechat/callback';
    
    let qrContent;
    if (isDev) {
      // 开发环境或未配置 AppID：使用模拟登录
      // In dev flow, open the confirm page so user can see/refine referral code before confirm.
      qrContent = `${devBaseUrl}/api/auth/wechat/confirm?ticket=${ticket}`;
      
    } else {
      // 生产环境：微信开放平台登录URL
      if (!appId) {
        return NextResponse.json(
          { success: false, error: '微信登录未配置，请联系管理员' },
          { status: 500 }
        );
      }
      
      const safeAppId = appId.trim();
      const redirectUriRaw = forceHttps(
        normalizeUrl(configuredWechatRedirectUri || fallbackWechatRedirectUri)
      ) || fallbackWechatRedirectUri;
      const redirectUri = encodeURIComponent(redirectUriRaw);
      qrContent = `https://open.weixin.qq.com/connect/qrconnect?appid=${safeAppId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${ticket}#wechat_redirect`;
      
    }
    
    // 生成二维码
    const qrCode = await QRCode.toDataURL(qrContent, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
    
    return NextResponse.json({
      success: true,
      qrCode,
      ticket,
      dev: isDev,
      devUrl: isDev ? qrContent : undefined,
      authUrl: !isDev ? qrContent : undefined,
      expiresIn: 300, // 5分钟
      message: isDev ? '开发模式：扫码后将模拟微信登录' : '生产模式：请使用微信扫码'
    });
  } catch (error: unknown) {
    console.error('生成二维码失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '生成二维码失败' },
      { status: 500 }
    );
  }
}
