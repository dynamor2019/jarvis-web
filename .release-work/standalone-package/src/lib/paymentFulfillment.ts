import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

function resolveBuyoutLicenseType(orderType: string, productName: string | null): 'lifetime_personal' | 'lifetime_pro' {
  if (orderType === 'lifetime_personal' || orderType === 'lifetime_pro') {
    return orderType
  }

  const normalizedName = (productName || '').toLowerCase()
  return normalizedName.includes('pro') ? 'lifetime_pro' : 'lifetime_personal'
}

async function ensurePaymentTransaction(
  tx: Prisma.TransactionClient,
  order: Awaited<ReturnType<typeof prisma.order.findUnique>>,
  paymentMethod: string
) {
  if (!order) return

  const existingTransaction = await tx.transaction.findFirst({
    where: {
      userId: order.userId,
      type: 'recharge',
      OR: [
        { description: { contains: order.orderNo } },
        {
          amount: order.amount,
          paymentMethod,
          description: { contains: order.productName },
        },
      ],
    },
  })
  if (existingTransaction) return

  const user = await tx.user.findUnique({ where: { id: order.userId } })
  if (!user) return
  const isSubscription = order.orderType === 'subscription'
  const isBuyout =
    order.orderType === 'lifetime' ||
    order.orderType === 'lifetime_personal' ||
    order.orderType === 'lifetime_pro'
  const transactionLabel = isSubscription ? '订阅' : isBuyout ? '买断' : '充值'

  await tx.transaction.create({
    data: {
      userId: order.userId,
      type: 'recharge',
      amount: order.amount,
      tokens: order.tokens,
      balance: user.balance,
      tokenBalance: user.tokenBalance,
      description: `${transactionLabel}${order.productName}（模型 ${order.modelType || 'default'}，订单 ${order.orderNo}）`,
      paymentMethod,
      status: 'completed',
    },
  })
}

export async function fulfillPaidOrder(orderNo: string, paymentMethod: string) {
  const order = await prisma.order.findUnique({ where: { orderNo } })
  if (!order) return { success: false, reason: 'order_not_found' }
  if (order.status === 'paid') {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await ensurePaymentTransaction(tx, order, paymentMethod)
    })
    return { success: true, alreadyPaid: true, order }
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'paid', paymentMethod, paymentTime: new Date() },
    })

    const isSubscription = order.orderType === 'subscription'
    const isBuyout =
      order.orderType === 'lifetime' ||
      order.orderType === 'lifetime_personal' ||
      order.orderType === 'lifetime_pro'
    const hasTokens = !!order.tokens && order.tokens > 0
    let updatedUser

    if (order.orderType === 'token_pack' && hasTokens) {
      updatedUser = await tx.user.update({
        where: { id: order.userId },
        data: {
          trafficTokenBalance: { increment: order.tokens ?? 0 },
          tokenBalance: { increment: order.tokens ?? 0 },
          totalSpent: { increment: order.amount },
        },
      })
    } else if (isSubscription || isBuyout) {
      const buyoutLicenseType = resolveBuyoutLicenseType(order.orderType, order.productName)
      const updateData: any = {
        totalSpent: { increment: order.amount },
        licenseType: isBuyout ? buyoutLicenseType : 'subscription',
        subscriptionEnd: isBuyout
          ? null
          : (order.duration
            ? new Date(Date.now() + order.duration * 30 * 24 * 60 * 60 * 1000)
            : undefined),
      }
      if (!isBuyout && hasTokens) {
        updateData.subscriptionTokenBalance = { increment: order.tokens ?? 0 }
        updateData.tokenBalance = { increment: order.tokens ?? 0 }
      }
      updatedUser = await tx.user.update({
        where: { id: order.userId },
        data: updateData,
      })

      const licenseKey = `LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`
      await tx.license.create({
        data: {
          userId: order.userId,
          licenseKey,
          licenseType: isBuyout ? buyoutLicenseType : 'subscription',
          status: 'active',
          expiresAt: isBuyout
            ? null
            : (order.duration
              ? new Date(Date.now() + order.duration * 30 * 24 * 60 * 60 * 1000)
              : null),
        },
      })

      const modelType = order.modelType || 'deepseek'
      const apiKey = `sk-${modelType}-${Math.random().toString(36).substring(2, 10)}`
      await tx.apiKey.create({
        data: {
          userId: order.userId,
          provider: 'openai',
          key: apiKey,
          modelType,
          isActive: true,
          expiresAt: isBuyout
            ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
            : (order.duration
              ? new Date(Date.now() + order.duration * 30 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        },
      })
    } else {
      updatedUser = await tx.user.update({
        where: { id: order.userId },
        data: { totalSpent: { increment: order.amount } },
      })
    }

    await ensurePaymentTransaction(tx, order, paymentMethod)
  })

  return { success: true, alreadyPaid: false, order }
}

export async function backfillPaidOrderTransactions(userId?: string) {
  const orders = await prisma.order.findMany({
    where: {
      status: 'paid',
      ...(userId ? { userId } : {}),
    },
    orderBy: { paymentTime: 'desc' },
    take: 100,
  })

  for (const order of orders) {
    const paymentMethod = order.paymentMethod || 'alipay'
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await ensurePaymentTransaction(tx, order, paymentMethod)
    })
  }
}
