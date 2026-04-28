// [CodeGuard Feature Index]
// - Auth and token source resolution -> line 13
// - Effective license/api key resolution -> line 79
// - Dual-wallet response output -> line 146
// [/CodeGuard Feature Index]

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { hash } from '@/lib/encryption';

// ?? Token ???????
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: '???' }, { status: 401 });
    }

    let userId: string | null = null;

    // 1) JWT
    const payload = verifyToken(token);
    if (payload) {
      userId = payload.userId;
    } else {
      // 2) API Key
      const keyHash = hash(token);
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
          key: keyHash,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        select: { userId: true },
      });

      if (apiKeyRecord) {
        userId = apiKeyRecord.userId;
      } else {
        // 3) License Key
        try {
          const licenseRecord = await prisma.license.findFirst({
            where: { licenseKey: token, status: 'active' },
            select: { userId: true },
          });
          if (licenseRecord) {
            userId = licenseRecord.userId;
          }
        } catch {
          // ignore license lookup errors
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Token??' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        trafficTokenBalance: true,
        subscriptionTokenBalance: true,
        balance: true,
        role: true,
        licenseType: true,
        subscriptionEnd: true,
        updatedAt: true,
        licenses: {
          where: { status: 'active' },
          select: {
            licenseType: true,
            expiresAt: true,
            licenseKey: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: '?????' }, { status: 404 });
    }

    let effectiveLicenseType = user.licenseType;
    let effectiveSubscriptionEnd = user.subscriptionEnd;
    let effectiveApiKey: string | null = null;
    let effectiveModelType: string | null = null;

    if (user.licenses && user.licenses.length > 0) {
      const activeLicense = user.licenses[0];
      if (!activeLicense.expiresAt || new Date(activeLicense.expiresAt) > new Date()) {
        effectiveLicenseType = activeLicense.licenseType;
        if (activeLicense.expiresAt) {
          effectiveSubscriptionEnd = activeLicense.expiresAt;
        }
        if (activeLicense.licenseKey) {
          effectiveApiKey = activeLicense.licenseKey;
        }
      }
    }

    if (
      !effectiveApiKey &&
      (
        effectiveLicenseType === 'subscription' ||
        effectiveLicenseType === 'lifetime' ||
        effectiveLicenseType === 'lifetime_personal' ||
        effectiveLicenseType === 'lifetime_pro'
      )
    ) {
      const latestKey = await prisma.apiKey.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (latestKey) {
        effectiveApiKey = null;
        effectiveModelType = latestKey.modelType;
      }
    } else if (effectiveApiKey) {
      const keyHash = hash(effectiveApiKey);
      const keyRecord = await prisma.apiKey.findFirst({
        where: {
          key: keyHash,
          userId: user.id,
        },
      });

      if (keyRecord) {
        effectiveModelType = keyRecord.modelType;
      } else {
        const latestKey = await prisma.apiKey.findFirst({
          where: {
            userId: user.id,
            isActive: true,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (latestKey) {
          effectiveModelType = latestKey.modelType;
        }
      }
    }

    const trafficBalance = user.trafficTokenBalance || 0;
    const subscriptionBalance = user.subscriptionTokenBalance || 0;
    const tokenBalance = trafficBalance + subscriptionBalance;
    const walletUpdatedAt = user.updatedAt ? new Date(user.updatedAt).getTime() : Date.now();

    return NextResponse.json({
      success: true,
      userId: user.id,
      username: user.username,
      email: user.email,
      tokenBalance,
      trafficBalance,
      subscriptionBalance,
      trafficTokenBalance: trafficBalance,
      subscriptionTokenBalance: subscriptionBalance,
      trafficUpdatedAt: walletUpdatedAt,
      subscriptionUpdatedAt: walletUpdatedAt,
      balance: user.balance,
      role: user.role,
      licenseType: effectiveLicenseType,
      subscriptionEnd: effectiveSubscriptionEnd,
      apiKey: effectiveApiKey,
      modelType: effectiveModelType,
      billingMode: effectiveLicenseType === 'subscription' ? 'subscription' : 'traffic',
      hasActiveSubscription: effectiveLicenseType === 'subscription',
    });
  } catch (error) {
    console.error('??Token????:', error);
    return NextResponse.json(
      { success: false, error: '?????' },
      { status: 500 }
    );
  }
}
