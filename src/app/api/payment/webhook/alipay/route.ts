import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function resolveBuyoutLicenseType(orderType: string, productName: string | null): 'lifetime_personal' | 'lifetime_pro' {
  if (orderType === 'lifetime_personal' || orderType === 'lifetime_pro') {
    return orderType
  }

  const normalizedName = (productName || '').toLowerCase()
  return normalizedName.includes('pro') ? 'lifetime_pro' : 'lifetime_personal'
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const body = rawBody.includes('=') ? Object.fromEntries(new URLSearchParams(rawBody)) : JSON.parse(rawBody || '{}')
    const orderNo = body?.orderNo || body?.out_trade_no || ''
    if (!orderNo) return new Response('failure', { status: 400 })
    if (body?.trade_status && body.trade_status !== 'TRADE_SUCCESS' && body.trade_status !== 'TRADE_FINISHED') {
      return new Response('success')
    }
    const order = await prisma.order.findUnique({ where: { orderNo } })
    if (!order) return new Response('failure', { status: 404 })
    if (order.status !== 'paid') {
      const updatedOrder = await prisma.order.update({ where: { id: order.id }, data: { status: 'paid', paymentMethod: 'alipay', paymentTime: new Date() } })
      
      // Update User Balance/Tokens
      if (updatedOrder.orderType === 'token_pack' && updatedOrder.tokens) {
          await prisma.user.update({
              where: { id: updatedOrder.userId },
              data: { 
                  trafficTokenBalance: { increment: updatedOrder.tokens },
                  tokenBalance: { increment: updatedOrder.tokens }
              }
          })
      } else if (
        updatedOrder.orderType === 'subscription' ||
        updatedOrder.orderType === 'lifetime' ||
        updatedOrder.orderType === 'lifetime_personal' ||
        updatedOrder.orderType === 'lifetime_pro'
      ) {
           const isBuyout = updatedOrder.orderType !== 'subscription'
           const buyoutLicenseType = resolveBuyoutLicenseType(updatedOrder.orderType, updatedOrder.productName)
           const updateData: any = { 
                  licenseType: isBuyout ? buyoutLicenseType : 'subscription',
                  subscriptionEnd: isBuyout ? null : (updatedOrder.duration ? new Date(Date.now() + updatedOrder.duration * 30 * 24 * 60 * 60 * 1000) : null)
           };
           if (!isBuyout && updatedOrder.tokens && updatedOrder.tokens > 0) {
               updateData.subscriptionTokenBalance = { increment: updatedOrder.tokens };
               updateData.tokenBalance = { increment: updatedOrder.tokens };
           }
           await prisma.user.update({
              where: { id: updatedOrder.userId },
              data: updateData
          })
      }
    }
    return new Response('success')
  } catch {
    return new Response('failure', { status: 400 })
  }
}
