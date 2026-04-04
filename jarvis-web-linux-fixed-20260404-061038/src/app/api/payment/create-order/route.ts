import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // 浠?Authorization header 鑾峰彇 token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let payload = verifyToken(token);

    // 寮€鍙戠幆澧冧笅锛屽鏋?Token 楠岃瘉澶辫触锛堝彲鑳芥槸鏈湴 Secret 涓嶄竴鑷达級锛屽厑璁镐娇鐢?Mock 鐢ㄦ埛
    if (!payload && process.env.NODE_ENV === 'development') {
       
       const mockUserId = 'mock-dev-user';
       
       // 纭繚 Mock 鐢ㄦ埛瀛樺湪
       const mockUser = await prisma.user.findUnique({ where: { id: mockUserId } });
       if (!mockUser) {
           
           await prisma.user.create({
               data: {
                   id: mockUserId,
                   email: 'mock@dev.local',
                   username: 'mockuser',
                   password: 'mockpassword', 
                   role: 'user',
                   balance: 10000,
                   trafficTokenBalance: 100000,
                   subscriptionTokenBalance: 0,
                   tokenBalance: 100000,
               }
           });
       }
       payload = { userId: mockUserId };
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token鏃犳晥' },
        { status: 401 }
      );
    }
    const userId = payload.userId;

    const { orderType, productName, amount, tokens, duration, modelType } = await request.json();

    if (!orderType || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, error: 'missing_params' },
        { status: 400 }
      );
    }

    // 鐢熸垚璁㈠崟鍙?
    const orderNo = `JV${Date.now()}${nanoid(6)}`;

    // 鍒涘缓璁㈠崟
    const order = await prisma.order.create({
      data: {
        userId,
        orderNo,
        orderType,
        productName,
        amount,
        tokens,
        duration,
        status: amount === 0 ? 'paid' : 'pending',
        modelType, // 娣诲姞妯″瀷绫诲瀷鍒拌鍗?
      }
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        productName: order.productName
      }
    });
  } catch (error) {
    console.error('鍒涘缓璁㈠崟閿欒:', error);
    return NextResponse.json(
      { success: false, error: `鍒涘缓璁㈠崟澶辫触: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

