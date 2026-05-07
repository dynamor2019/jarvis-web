import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentConfig } from '@/lib/config'
import { createDecipheriv } from 'crypto'

function decryptWechatResource(
  resource: { ciphertext: string; nonce: string; associated_data?: string },
  apiKeyV3: string
) {
  if (apiKeyV3.length !== 32) {
    throw new Error('invalid_apiv3_key_length')
  }
  const key = Buffer.from(apiKeyV3, 'utf8')
  const nonce = Buffer.from(resource.nonce, 'utf8')
  const associatedData = resource.associated_data ? Buffer.from(resource.associated_data, 'utf8') : null
  const ciphertext = Buffer.from(resource.ciphertext, 'base64')
  const authTag = ciphertext.subarray(ciphertext.length - 16)
  const data = ciphertext.subarray(0, ciphertext.length - 16)
  const decipher = createDecipheriv('aes-256-gcm', key, nonce)
  if (associatedData) {
    decipher.setAAD(associatedData)
  }
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}

function resolveBuyoutLicenseType(orderType: string, productName: string | null): 'lifetime_personal' | 'lifetime_pro' {
  if (orderType === 'lifetime_personal' || orderType === 'lifetime_pro') {
    return orderType
  }

  const normalizedName = (productName || '').toLowerCase()
  return normalizedName.includes('pro') ? 'lifetime_pro' : 'lifetime_personal'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let payload: any = body
    if (body?.resource?.ciphertext && body?.resource?.nonce) {
      const config = await getPaymentConfig()
      const apiKeyV3 = config.wechat.apiKeyV3
      if (!apiKeyV3) return NextResponse.json({ code: 'FAIL', message: 'missing_apiv3_key' }, { status: 400 })
      try {
        payload = decryptWechatResource(body.resource, apiKeyV3)
      } catch {
        return NextResponse.json({ code: 'FAIL', message: 'decrypt_failed' }, { status: 400 })
      }
    }
    const orderNo = payload?.out_trade_no || payload?.orderNo || body?.orderNo || body?.out_trade_no || ''
    const paid = payload?.trade_state === 'SUCCESS' || body?.trade_state === 'SUCCESS' || body?.event_type === 'TRANSACTION.SUCCESS'
    if (!orderNo) return NextResponse.json({ code: 'FAIL', message: 'missing_order' }, { status: 400 })
    if (!paid) return NextResponse.json({ code: 'SUCCESS', message: '成功' })
    const order = await prisma.order.findUnique({ where: { orderNo } })
    if (!order) return NextResponse.json({ code: 'FAIL', message: 'order_not_found' }, { status: 404 })
    if (order.status !== 'paid') {
      const updatedOrder = await prisma.order.update({ where: { id: order.id }, data: { status: 'paid', paymentMethod: 'wechat', paymentTime: new Date() } })
      
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
    return NextResponse.json({ code: 'SUCCESS', message: '成功' })
  } catch {
    return NextResponse.json({ code: 'FAIL', message: 'bad_request' }, { status: 400 })
  }
}
