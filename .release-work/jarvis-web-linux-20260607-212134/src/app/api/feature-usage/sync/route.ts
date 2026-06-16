import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { hash } from '@/lib/encryption';

const MAX_FEATURE_NAME = 80;
const MAX_COUNTER_DELTA = 100000;

function toNonNegativeInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const intVal = Math.floor(value);
    return intVal >= 0 ? intVal : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    const intVal = Math.floor(num);
    return intVal >= 0 ? intVal : null;
  }
  return null;
}

function normalizeClientId(value: unknown): string {
  if (typeof value !== 'string') return 'unknown_client';
  const cleaned = value.trim().slice(0, 128);
  return cleaned.length > 0 ? cleaned : 'unknown_client';
}

function normalizeCounters(value: unknown): Array<{ feature: string; delta: number }> {
  if (!value || typeof value !== 'object') return [];
  const result: Array<{ feature: string; delta: number }> = [];

  for (const [rawFeature, rawDelta] of Object.entries(value as Record<string, unknown>)) {
    const feature = rawFeature.trim().slice(0, MAX_FEATURE_NAME);
    if (!feature) continue;

    const delta = toNonNegativeInt(rawDelta);
    if (delta === null || delta <= 0) continue;

    result.push({
      feature,
      delta: Math.min(delta, MAX_COUNTER_DELTA),
    });
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization') || '';
    const authApiKeyHeader = (request.headers.get('x-jarvis-api-key') || '').trim();
    const authApiKeyBody = typeof (body as any).authApiKey === 'string' ? (body as any).authApiKey.trim() : '';
    const authApiKey = authApiKeyHeader || authApiKeyBody;

    let authUserId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const payload = verifyToken(token);
      if (!payload?.userId) {
        return NextResponse.json({ success: false, error: 'invalid_token' }, { status: 401 });
      }
      authUserId = payload.userId;
    } else if (authApiKey) {
      const keyHash = hash(authApiKey);
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
          OR: [
            { key: keyHash },
            { key: authApiKey },
          ],
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        select: { userId: true },
      });

      if (!apiKeyRecord?.userId) {
        return NextResponse.json({ success: false, error: 'invalid_api_key' }, { status: 401 });
      }
      authUserId = apiKeyRecord.userId;
    } else {
      return NextResponse.json({ success: false, error: 'missing_auth' }, { status: 401 });
    }

    const requestUserId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const userId = requestUserId || authUserId;
    if (userId !== authUserId) {
      return NextResponse.json({ success: false, error: 'forbidden_user_mismatch' }, { status: 403 });
    }

    const counters = normalizeCounters((body as any).counters);
    const clientId = normalizeClientId((body as any).clientId);

    const tokenConsumed = toNonNegativeInt((body as any).tokenConsumed);
    const tokenRemaining = toNonNegativeInt((body as any).tokenRemaining);
    const trafficRemaining = toNonNegativeInt((body as any).trafficRemaining);
    const subscriptionRemaining = toNonNegativeInt((body as any).subscriptionRemaining);
    const hasSnapshot =
      tokenConsumed !== null ||
      tokenRemaining !== null ||
      trafficRemaining !== null ||
      subscriptionRemaining !== null;

    if (counters.length === 0 && !hasSnapshot) {
      return NextResponse.json({
        success: true,
        noOp: true,
        countersAccepted: 0,
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) {
      return NextResponse.json({ success: false, error: 'user_not_found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of counters) {
        await tx.userFeatureUsage.upsert({
          where: {
            userId_feature: {
              userId,
              feature: item.feature,
            },
          },
          create: {
            userId,
            feature: item.feature,
            count: item.delta,
          },
          update: {
            count: { increment: item.delta },
          },
        });
      }

      if (hasSnapshot) {
        const existing = await tx.userHabitSnapshot.findUnique({
          where: {
            userId_clientId: {
              userId,
              clientId,
            },
          },
        });

        if (!existing) {
          await tx.userHabitSnapshot.create({
            data: {
              userId,
              clientId,
              tokenConsumed: tokenConsumed ?? 0,
              tokenRemaining: tokenRemaining ?? 0,
              trafficRemaining: trafficRemaining ?? 0,
              subscriptionRemaining: subscriptionRemaining ?? 0,
              lastSyncedAt: new Date(),
            },
          });
        } else {
          await tx.userHabitSnapshot.update({
            where: {
              userId_clientId: {
                userId,
                clientId,
              },
            },
            data: {
              tokenConsumed: tokenConsumed === null ? existing.tokenConsumed : Math.max(existing.tokenConsumed, tokenConsumed),
              tokenRemaining: tokenRemaining ?? existing.tokenRemaining,
              trafficRemaining: trafficRemaining ?? existing.trafficRemaining,
              subscriptionRemaining: subscriptionRemaining ?? existing.subscriptionRemaining,
              lastSyncedAt: new Date(),
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      countersAccepted: counters.length,
      snapshotUpdated: hasSnapshot,
      clientId,
    });
  } catch (error) {
    console.error('feature usage sync error:', error);
    return NextResponse.json({ success: false, error: 'sync_failed' }, { status: 500 });
  }
}
