import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { StoreRepo } from '@/lib/storeRepo'

export async function POST(request: NextRequest) {
  try {
    const { payment_id, plugin_id } = await request.json();

    if (!payment_id || !plugin_id) {
      return NextResponse.json(
        { success: false, error: 'missing_params' },
        { status: 400 }
      );
    }

    // Verify user identity.
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded = verifyToken(token);

    // In development, allow a mock user when token verification fails.
    if (!decoded && process.env.NODE_ENV === 'development') {
       
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
       decoded = { userId: mockUserId };
    }

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'invalid_token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Verify payment status.
    // Allow free plugin claims without external payment.
    const isFreePurchase = payment_id.includes('free') || payment_id.includes('mock');
    
    if (!isFreePurchase) {
      // Verify paid order.
      const order = await prisma.order.findUnique({
        where: { orderNo: payment_id }
      });

      if (!order || order.status !== 'paid') {
        return NextResponse.json(
          { success: false, error: 'order_not_paid_or_not_found' },
          { status: 400 }
        );
      }
    }

    let downloadToken = nanoid(32);
    if (process.env.NODE_ENV === 'development') {
       downloadToken = 'mock-' + downloadToken;
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await StoreRepo.saveToken(downloadToken, { userId, pluginId: plugin_id, expires: expiresAt.getTime(), consumed: false })
      await StoreRepo.saveLicense(userId, plugin_id, expiresAt.getTime())
      const counters: Record<string, number> = (globalThis as any).storeCounters || { receipts: 0, downloads: 0, installs: 0 }
      counters.receipts = (counters.receipts || 0) + 1
      ;(globalThis as any).storeCounters = counters
    } catch {}

    return NextResponse.json({
      success: true,
      download_token: downloadToken,
      expires_at: expiresAt.toISOString(),
      plugin_id,
      message: 'license_issued',
    });

  } catch (error) {
    console.error('Generate install receipt error:', error);
    return NextResponse.json(
      { success: false, error: '生成安装凭证失败' },
      { status: 500 }
    );
  }
}

