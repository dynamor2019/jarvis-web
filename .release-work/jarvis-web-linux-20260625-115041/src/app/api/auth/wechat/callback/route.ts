// Policy: Do not modify directly. Explain reason before edits. Last confirm reason: Use status redirect flow and stable public base URL for callback redirects

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getPaymentConfig } from '@/lib/config';

// 微信登录回调（生产环境）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // ticket
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/login?error=missing_params', process.env.NEXT_PUBLIC_BASE_URL || request.url)
      );
    }
    
    // 检查ticket
    const tickets = globalThis.wechatTickets || {};
    const ticketData = tickets[state];
    
    if (!ticketData) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_ticket', process.env.NEXT_PUBLIC_BASE_URL || request.url)
      );
    }
    
    // 使用code换取access_token
    const paymentConfig = await getPaymentConfig();
    const appId = paymentConfig.wechat.appId || process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('wechat_config_missing');
    }
    
    const tokenResponse = await axios.get(
      'https://api.weixin.qq.com/sns/oauth2/access_token',
      {
        params: {
          appid: appId,
          secret: appSecret,
          code,
          grant_type: 'authorization_code',
        },
      }
    );
    
    const { access_token, openid, unionid } = tokenResponse.data;
    
    if (!access_token) {
      throw new Error('获取access_token失败');
    }
    
    // 获取用户信息
    const userInfoResponse = await axios.get(
      'https://api.weixin.qq.com/sns/userinfo',
      {
        params: {
          access_token,
          openid,
        },
      }
    );
    
    const wechatUser = userInfoResponse.data;
    
    // 更新ticket状态
    tickets[state] = {
      ...ticketData,
      status: 'success',
      userInfo: {
        email: `wechat_${openid}@jarvis.com`,
        username: `wx_${openid.substr(-8)}`,
        name: wechatUser.nickname,
        avatar: wechatUser.headimgurl,
        openid,
        unionid,
      },
      scannedAt: Date.now(),
    };
    
    // 重定向到登录页面，前端会轮询状态
    return NextResponse.redirect(
      new URL(`/api/auth/wechat/status?ticket=${encodeURIComponent(state)}&redirect=1`, process.env.NEXT_PUBLIC_BASE_URL || request.url)
    );
  } catch (error: unknown) {
    console.error('微信登录回调失败:', error);
    const message = error instanceof Error ? error.message : '微信回调失败';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_BASE_URL || request.url)
    );
  }
}
