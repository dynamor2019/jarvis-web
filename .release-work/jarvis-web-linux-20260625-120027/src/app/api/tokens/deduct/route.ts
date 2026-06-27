import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function isBuyoutUser(licenseType: string | null | undefined): boolean {
  return (
    licenseType === 'lifetime' ||
    licenseType === 'lifetime_personal' ||
    licenseType === 'lifetime_pro'
  );
}

type WalletType = 'traffic' | 'subscription' | null;

function resolveWalletType(input: unknown): WalletType {
  if (input === 'traffic' || input === 'subscription') {
    return input;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const body = await request.json();
    const { userId: bodyUserId, tokens, model, operation, tokenType } = body;

    let userId = bodyUserId;
    if (token && !userId) {
      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json({ success: false, error: 'invalid_token' }, { status: 401 });
      }
      userId = payload.userId;
    }

    if (!userId || !tokens) {
      return NextResponse.json({ success: false, error: 'missing_params' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        licenseType: true,
        tokenBalance: true,
        trafficTokenBalance: true,
        subscriptionTokenBalance: true,
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'user_not_found' }, { status: 404 });
    }

    if (isBuyoutUser(user.licenseType)) {
      await prisma.usageRecord.create({
        data: {
          userId,
          model: model || 'unknown',
          tokens: 0,
          cost: 0,
          operation: operation || 'generate'
        }
      });

      return NextResponse.json({
        success: true,
        balance: (user.trafficTokenBalance || 0) + (user.subscriptionTokenBalance || 0),
        tokensUsed: 0,
        bypassedForBuyout: true
      });
    }

    const requestedType = resolveWalletType(tokenType);
    const inferredType: Exclude<WalletType, null> =
      user.licenseType === 'subscription' || user.licenseType === 'monthly'
        ? 'subscription'
        : 'traffic';
    const finalType: Exclude<WalletType, null> = requestedType || inferredType;

    const trafficBalance = user.trafficTokenBalance || 0;
    const subscriptionBalance = user.subscriptionTokenBalance || 0;
    const totalBalance = trafficBalance + subscriptionBalance;

    let nextTraffic = trafficBalance;
    let nextSubscription = subscriptionBalance;
    let usedTraffic = 0;
    let usedSubscription = 0;

    if (finalType === 'traffic') {
      if (trafficBalance < tokens) {
        return NextResponse.json(
          { success: false, error: 'traffic_token_insufficient', balance: totalBalance, trafficBalance, subscriptionBalance },
          { status: 403 }
        );
      }
      nextTraffic = trafficBalance - tokens;
      usedTraffic = tokens;
    } else {
      if (subscriptionBalance < tokens) {
        return NextResponse.json(
          { success: false, error: 'subscription_token_insufficient', balance: totalBalance, trafficBalance, subscriptionBalance },
          { status: 403 }
        );
      }
      nextSubscription = subscriptionBalance - tokens;
      usedSubscription = tokens;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        trafficTokenBalance: nextTraffic,
        subscriptionTokenBalance: nextSubscription,
        tokenBalance: nextTraffic + nextSubscription
      }
    });

    await prisma.usageRecord.create({
      data: {
        userId,
        model: model || 'unknown',
        tokens,
        cost: 0,
        operation: operation || 'generate'
      }
    });

    return NextResponse.json({
      success: true,
      balance: updatedUser.tokenBalance,
      tokensUsed: tokens,
      trafficBalance: updatedUser.trafficTokenBalance,
      subscriptionBalance: updatedUser.subscriptionTokenBalance,
      usedTraffic,
      usedSubscription,
      deductedWallet: finalType
    });
  } catch (error) {
    console.error('Token deduct error:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
