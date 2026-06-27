import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // Read token from Authorization header.
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let payload = verifyToken(token);

    // In development, allow a mock user when the local JWT secret does not match.
    if (!payload && process.env.NODE_ENV === 'development') {
       
       const mockUserId = 'mock-dev-user';
       
       // Ensure the mock user exists.
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
        { success: false, error: '登录已过期，请重新登录' },
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

    // Generate order number.
    const orderNo = `JV${Date.now()}${nanoid(6)}`;

    // Create order.
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
        modelType,
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
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: `创建订单失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

