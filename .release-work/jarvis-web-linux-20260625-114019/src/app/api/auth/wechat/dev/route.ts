import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

declare global {
  var wechatTickets: Record<string, any> | undefined;
}

// 开发环境：模拟微信登录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticket = searchParams.get('ticket');
    const action = searchParams.get('action');
    const requestReferralCode = String(searchParams.get('referralCode') || '').trim();
    const mockAccount = String(searchParams.get('mockAccount') || '').trim();
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: '缺少ticket参数' },
        { status: 400 }
      );
    }
    
    // 检查ticket是否存在
    const tickets = globalThis.wechatTickets || {};
    const ticketData = tickets[ticket];
    
    if (!ticketData) {
      if (action === 'confirm') {
        return NextResponse.json(
          { success: false, error: 'ticket已过期或不存在' },
          { status: 400 }
        );
      }
      return new NextResponse(
        '<html><body><h1>登录失败</h1><p>ticket已过期或不存在</p></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    
    // 模拟微信用户信息
    const accountSeed = mockAccount || process.env.WECHAT_DEV_OPENID || `${request.headers.get('user-agent') || 'ua'}|${request.headers.get('x-forwarded-for') || ''}`;
    const accountHash = createHash('sha256').update(accountSeed).digest('hex').slice(0, 20);
    const mockUser = {
      openid: `mock_openid_${accountHash}`,
      nickname: '测试用户',
      headimgurl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
      unionid: `mock_unionid_${accountHash}`,
    };
    const referralCode = String(ticketData.referralCode || '').trim();
    const finalReferralCode = requestReferralCode || referralCode;
    const referralMessage = finalReferralCode
      ? `Referral code: ${finalReferralCode} (both users get +5000 Token)`
      : 'No referral code provided';
    
    // 更新ticket状态
    tickets[ticket] = {
      ...ticketData,
      referralCode: finalReferralCode || undefined,
      status: 'success',
      userInfo: {
        email: `wechat_${mockUser.openid}@jarvis.com`,
        username: `wx_${mockUser.openid.substr(-8)}`,
        name: mockUser.nickname,
        avatar: mockUser.headimgurl,
        openid: mockUser.openid,
        unionid: mockUser.unionid,
      },
      scannedAt: Date.now(),
    };
    
    // 如果是确认操作，返回JSON
    if (action === 'confirm') {
      return NextResponse.json({
        success: true,
        message: '登录成功',
        referralCode: finalReferralCode || null,
      });
    }
    
    // 返回成功页面
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>登录成功</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .checkmark {
            width: 40px;
            height: 40px;
            border: 4px solid white;
            border-top: none;
            border-left: none;
            transform: rotate(45deg);
            margin-top: -10px;
          }
          h1 {
            color: #1f2937;
            margin: 0 0 1rem;
          }
          p {
            color: #6b7280;
            margin: 0 0 2rem;
          }
          .info {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            text-align: left;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            margin: 0.5rem 0;
            font-size: 0.875rem;
          }
          .label {
            color: #6b7280;
          }
          .value {
            color: #1f2937;
            font-weight: 500;
          }
          .note {
            font-size: 0.875rem;
            color: #9ca3af;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">
            <div class="checkmark"></div>
          </div>
          <h1>登录成功！</h1>
          <p>微信扫码登录已完成</p>
          <div class="info">
            <div class="info-item">
              <span class="label">用户名：</span>
              <span class="value">${mockUser.nickname}</span>
            </div>
            <div class="info-item">
              <span class="label">OpenID：</span>
              <span class="value">${mockUser.openid.substr(0, 20)}...</span>
            </div>
            <div class="info-item">
              <span class="label">Referral</span>
              <span class="value">${finalReferralCode || 'N/A'}</span>
            </div>
          </div>
          <p class="note" style="color:#92400e;background:#fffbeb;border:1px solid #fde68a;padding:8px 10px;border-radius:8px;">${referralMessage}</p>
          <p class="note">请返回登录页面，系统将自动完成登录</p>
          <p class="note" style="margin-top: 0.5rem;">（开发模式 - 模拟登录）</p>
        </div>
      </body>
      </html>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' } 
      }
    );
  } catch (error: unknown) {
    console.error('模拟微信登录失败:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return new NextResponse(
      `<html><body><h1>登录失败</h1><p>${message}</p></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
