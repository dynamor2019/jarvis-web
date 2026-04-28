import { NextRequest, NextResponse } from 'next/server';

declare global {
  var alipayTickets: Record<string, any> | undefined;
}

// 开发环境：模拟支付宝登录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticket = searchParams.get('ticket');
    const action = searchParams.get('action');
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: '缺少ticket参数' },
        { status: 400 }
      );
    }
    
    // 检查ticket是否存在
    const tickets = globalThis.alipayTickets || {};
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
    
    // 模拟支付宝用户信息
    const mockUser = {
      user_id: `alipay_${Date.now()}`,
      nick_name: '支付宝用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alipay',
    };
    
    // 更新ticket状态
    tickets[ticket] = {
      ...ticketData,
      status: 'success',
      userInfo: {
        email: `alipay_${mockUser.user_id}@jarvis.com`,
        username: `zfb_${mockUser.user_id.substr(-8)}`,
        name: mockUser.nick_name,
        avatar: mockUser.avatar,
        alipayUserId: mockUser.user_id,
      },
      scannedAt: Date.now(),
    };
    
    // 如果是确认操作，返回JSON
    if (action === 'confirm') {
      return NextResponse.json({
        success: true,
        message: '登录成功',
      });
    }
    
    // 返回成功页面（不应该直接访问，应该通过confirm页面）
    return NextResponse.redirect(new URL(`/api/auth/alipay/confirm?ticket=${ticket}`, request.url));
  } catch (error: unknown) {
    console.error('模拟支付宝登录失败:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return new NextResponse(
      `<html><body><h1>登录失败</h1><p>${message}</p></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
