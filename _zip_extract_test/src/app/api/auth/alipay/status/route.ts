import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

declare global {
  var alipayTickets: Record<string, any> | undefined;
}

const JWT_SECRET = env.JWT_SECRET;

// 妫€鏌ユ敮浠樺疂鐧诲綍鐘舵€?
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticket = searchParams.get('ticket');
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: '缂哄皯ticket鍙傛暟' },
        { status: 400 }
      );
    }
    
    // 妫€鏌icket鐘舵€?
    const tickets = globalThis.alipayTickets || {};
    const ticketData = tickets[ticket];
    
    if (!ticketData) {
      return NextResponse.json({
        success: false,
        status: 'expired',
        message: 'ticket_expired',
      });
    }
    
    // 妫€鏌ユ槸鍚﹀凡杩囨湡
    if (Date.now() > ticketData.expiresAt) {
      delete tickets[ticket];
      return NextResponse.json({
        success: false,
        status: 'expired',
        message: 'ticket_expired',
      });
    }
    
    // 妫€鏌ユ槸鍚﹀凡鎵爜骞舵巿鏉?
    if (ticketData.status === 'success' && ticketData.userInfo) {
      // 鍒涘缓鎴栨洿鏂扮敤鎴?
      const user = await prisma.user.upsert({
        where: { 
          email: ticketData.userInfo.email 
        },
        update: {
          name: ticketData.userInfo.name,
          avatar: ticketData.userInfo.avatar,
          updatedAt: new Date(),
        },
        create: {
          email: ticketData.userInfo.email,
          username: ticketData.userInfo.username,
          password: 'alipay_login', // 鏀粯瀹濈櫥褰曠敤鎴锋棤瀵嗙爜
          name: ticketData.userInfo.name,
          avatar: ticketData.userInfo.avatar,
          role: 'user',
          balance: 0,
          trafficTokenBalance: 100000,
          subscriptionTokenBalance: 0,
          tokenBalance: 100000, // 鏂扮敤鎴疯禒閫?0涓嘥oken
          isActive: true,
        },
      });
      
      // 鐢熸垚JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          username: user.username,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // 鏇存柊鐧诲綍淇℃伅
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      });
      
      // 娓呯悊ticket
      delete tickets[ticket];
      
      return NextResponse.json({
        success: true,
        status: 'success',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          balance: user.balance,
          tokenBalance: user.tokenBalance,
        },
        token,
      });
    }
    
    return NextResponse.json({
      success: true,
      status: ticketData.status,
      message: ticketData.status === 'pending' ? '绛夊緟鎵爜' : '宸叉壂鐮侊紝绛夊緟纭',
    });
  } catch (error: unknown) {
    console.error('妫€鏌ユ敮浠樺疂鐧诲綍鐘舵€佸け璐?', error);
    const message = error instanceof Error ? error.message : 'server_error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

