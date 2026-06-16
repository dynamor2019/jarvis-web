import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
function resolveBuyoutLicenseType(orderType: string, productName: string | null): 'lifetime_personal' | 'lifetime_pro' {
  if (orderType === 'lifetime_personal' || orderType === 'lifetime_pro') {
    return orderType;
  }

  const normalizedName = (productName || '').toLowerCase();
  return normalizedName.includes('pro') ? 'lifetime_pro' : 'lifetime_personal';
}

export async function POST(request: NextRequest) {
  // 允许模拟支付 (配合 /mock 页面使用)
  // const isDev = process.env.NODE_ENV === 'development';
  // const isMockEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_PAY === 'true';

  // if (!isDev && !isMockEnabled) {
  //   return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  // }

  try {
    const body = await request.json();
    const orderId = body.orderId || body.orderNo;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Try finding by orderNo first (common case), then by id
    let order = await prisma.order.findUnique({
      where: { orderNo: orderId },
      include: { user: true }
    });

    if (!order) {
       order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true }
      });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'paid') {
      return NextResponse.json({ success: true, message: 'Already paid' });
    }

    // 使用事务处理订单状态更新、用户余额更新和交易记录创建
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. 更新订单状态
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paymentTime: new Date(),
          paymentMethod: 'mock_alipay'
        }
      });

      // 2. 更新用户余额/Token 和授权状态
      let updatedUser;
      
      const isSubscription = order.orderType === 'subscription';
      const isBuyout = order.orderType === 'lifetime' || order.orderType === 'lifetime_personal' || order.orderType === 'lifetime_pro';
      const hasTokens = order.tokens && order.tokens > 0;
      
      if (order.orderType === 'token_pack' && hasTokens) {
        updatedUser = await tx.user.update({
          where: { id: order.userId },
          data: {
            trafficTokenBalance: { increment: order.tokens ?? 0 },
            tokenBalance: { increment: order.tokens ?? 0 },
            totalSpent: { increment: order.amount }
          }
        });
      } else if (isSubscription || isBuyout) {
        // 订阅/买断类型：更新授权状态+ 增加Token（如果有）
        const buyoutLicenseType = resolveBuyoutLicenseType(order.orderType, order.productName);
        const updateData: any = {
          totalSpent: { increment: order.amount },
          licenseType: isBuyout ? buyoutLicenseType : 'subscription',
          // 延长订阅时间
          subscriptionEnd: isBuyout
            ? null
            : (order.duration
              ? new Date(Date.now() + order.duration * 30 * 24 * 60 * 60 * 1000)
              : undefined)
        };
        
        // 如果订阅包含 Token，也增加余额
        if (!isBuyout && hasTokens && order.tokens) {
           updateData.subscriptionTokenBalance = { increment: order.tokens ?? 0 };
           updateData.tokenBalance = { increment: order.tokens ?? 0 };
        }
        
        updatedUser = await tx.user.update({
          where: { id: order.userId },
          data: updateData
        });
      } else {
        // 其他类型，只更新消费金额
        updatedUser = await tx.user.update({
          where: { id: order.userId },
          data: {
            totalSpent: { increment: order.amount }
          }
        });
      }

      // 3. 如果是订阅买断，创建License 和ApiKey 记录
    if (isSubscription || isBuyout) {
        const buyoutLicenseType = resolveBuyoutLicenseType(order.orderType, order.productName);
        const resolvedLicenseType = isBuyout ? buyoutLicenseType : 'subscription';

        // Create License
        const licenseKey = `LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;
        await tx.license.create({
            data: {
                userId: order.userId,
                licenseKey: licenseKey,
                licenseType: resolvedLicenseType,
                status: 'active',
                expiresAt: isBuyout
                    ? null
                    : (order.duration
                        ? new Date(Date.now() + order.duration * 30 * 24 * 60 * 60 * 1000)
                        : null)
            }
        });

        // Create ApiKey (Simulated)
        // Ensure we have a modelType
        const modelType = order.modelType || 'deepseek'; 
        const mockApiKey = `sk-${modelType}-${Math.random().toString(36).substring(2, 10)}`;
        
        await tx.apiKey.create({
            data: {
                userId: order.userId,
                provider: 'openai',
                key: mockApiKey,
                modelType: modelType,
                isActive: true,
                expiresAt: isBuyout
                    ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
                    : (order.duration
                        ? new Date(Date.now() + order.duration * 30 * 24 * 60 * 60 * 1000)
                        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // Default 1 year
            }
        });
    }

    // 4. 创建交易记录
    await tx.transaction.create({
        data: {
          userId: order.userId,
          type: 'recharge',
          amount: order.amount,
          tokens: order.tokens,
          balance: updatedUser.balance,
          tokenBalance: updatedUser.tokenBalance,
          description: `充值${order.productName} (模拟支付)`,
          paymentMethod: 'mock',
          status: 'completed'
        }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Mock pay error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


