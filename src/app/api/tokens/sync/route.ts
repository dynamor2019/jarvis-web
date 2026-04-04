import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type Snapshot = {
  trafficBalance?: number;
  subscriptionBalance?: number;
  trafficUpdatedAt?: number;
  subscriptionUpdatedAt?: number;
};

function toSafeInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.floor(n);
  }
  return null;
}

function toSafeMs(value: unknown): number | null {
  const n = toSafeInt(value);
  if (n === null || n <= 0) return null;
  return n;
}

function resolveWallet(
  serverBalance: number,
  serverUpdatedAt: number,
  clientBalance: number | null,
  clientUpdatedAt: number | null
) {
  if (clientBalance === null || clientUpdatedAt === null) {
    return { balance: serverBalance, source: 'server', reason: 'missing_client_snapshot' };
  }
  if (clientBalance < 0) {
    return { balance: serverBalance, source: 'server', reason: 'invalid_client_balance' };
  }
  if (clientUpdatedAt <= serverUpdatedAt) {
    return { balance: serverBalance, source: 'server', reason: 'server_newer_or_equal' };
  }

  // Risk guard: only accept newer client value when it does not increase server balance.
  if (clientBalance <= serverBalance) {
    return { balance: clientBalance, source: 'client', reason: 'client_newer_non_increasing' };
  }

  return { balance: serverBalance, source: 'server', reason: 'client_increase_rejected' };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'missing_token' }, { status: 401 });
    }

    const token = authHeader.substring(7).trim();
    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'invalid_token' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const records = Array.isArray(body) ? body : (Array.isArray(body?.records) ? body.records : []);
    const snapshot: Snapshot = body?.snapshot && typeof body.snapshot === 'object' ? body.snapshot : {};
    const requestUserId = (body?.userId || records?.[0]?.UserId || records?.[0]?.userId || '').toString();
    const userId = requestUserId || payload.userId;

    if (userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'forbidden_user_mismatch' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        trafficTokenBalance: true,
        subscriptionTokenBalance: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'user_not_found' }, { status: 404 });
    }

    const serverTraffic = user.trafficTokenBalance || 0;
    const serverSubscription = user.subscriptionTokenBalance || 0;
    const serverUpdatedAt = user.updatedAt ? new Date(user.updatedAt).getTime() : Date.now();

    const clientTraffic = toSafeInt(snapshot.trafficBalance);
    const clientSubscription = toSafeInt(snapshot.subscriptionBalance);
    const clientTrafficUpdatedAt = toSafeMs(snapshot.trafficUpdatedAt);
    const clientSubscriptionUpdatedAt = toSafeMs(snapshot.subscriptionUpdatedAt);

    const trafficResolution = resolveWallet(
      serverTraffic,
      serverUpdatedAt,
      clientTraffic,
      clientTrafficUpdatedAt
    );
    const subscriptionResolution = resolveWallet(
      serverSubscription,
      serverUpdatedAt,
      clientSubscription,
      clientSubscriptionUpdatedAt
    );

    const nextTraffic = trafficResolution.balance;
    const nextSubscription = subscriptionResolution.balance;
    const nextTotal = nextTraffic + nextSubscription;
    const changed = nextTraffic !== serverTraffic || nextSubscription !== serverSubscription;

    let effectiveUpdatedAt = serverUpdatedAt;
    if (changed) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          trafficTokenBalance: nextTraffic,
          subscriptionTokenBalance: nextSubscription,
          tokenBalance: nextTotal,
        },
        select: { updatedAt: true },
      });
      effectiveUpdatedAt = updated.updatedAt ? new Date(updated.updatedAt).getTime() : Date.now();
    }

    const syncedIds = records
      .map((r: any) => (r?.TokenId || r?.tokenId || '').toString())
      .filter((id: string) => id.length > 0);

    return NextResponse.json({
      success: true,
      synced_ids: syncedIds,
      server_records: [],
      resolved: {
        trafficTokenBalance: nextTraffic,
        subscriptionTokenBalance: nextSubscription,
        tokenBalance: nextTotal,
        trafficUpdatedAt: effectiveUpdatedAt,
        subscriptionUpdatedAt: effectiveUpdatedAt,
      },
      decisions: {
        traffic: trafficResolution,
        subscription: subscriptionResolution,
      },
    });
  } catch (error) {
    console.error('Token sync error:', error);
    return NextResponse.json({ success: false, error: 'sync_failed' }, { status: 500 });
  }
}

