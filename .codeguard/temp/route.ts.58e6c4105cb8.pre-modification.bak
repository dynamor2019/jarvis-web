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

    // 楠岃瘉鐢ㄦ埛韬唤
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded = verifyToken(token);

    // 寮€鍙戠幆澧冧笅锛屽鏋?Token 楠岃瘉澶辫触锛屽皾璇曚娇鐢?Mock 鐢ㄦ埛
    if (!decoded && process.env.NODE_ENV === 'development') {
       
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
       decoded = { userId: mockUserId };
    }

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'invalid_token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 楠岃瘉鏀粯鐘舵€侊紙杩欓噷绠€鍖栧鐞嗭紝瀹為檯搴旇楠岃瘉鐪熷疄鐨勬敮浠樿褰曪級
    // 瀵逛簬鍏嶈垂鎻掍欢锛岀洿鎺ラ€氳繃
    const isFreePurchase = payment_id.includes('free') || payment_id.includes('mock');
    
    if (!isFreePurchase) {
      // 楠岃瘉浠樿垂璁㈠崟
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
    console.error('鐢熸垚瀹夎鍑瘉閿欒:', error);
    return NextResponse.json(
      { success: false, error: '鐢熸垚瀹夎鍑瘉澶辫触' },
      { status: 500 }
    );
  }
}

