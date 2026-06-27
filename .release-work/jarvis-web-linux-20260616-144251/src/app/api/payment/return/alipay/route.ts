import { NextRequest, NextResponse } from 'next/server'
import { AlipaySdk } from 'alipay-sdk'

import { getPaymentConfig } from '@/lib/config'
import { env } from '@/lib/env'
import { fulfillPaidOrder } from '@/lib/paymentFulfillment'

function normalizePem(pem: string | null | undefined): string | undefined {
  if (!pem) return undefined
  return pem.replace(/\\n/g, '\n').trim()
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const orderNo = params.out_trade_no || ''
  const fallbackUrl = new URL('/store', env.NEXT_PUBLIC_BASE_URL || request.url)

  if (!orderNo) {
    fallbackUrl.searchParams.set('payment', 'missing_order')
    return NextResponse.redirect(fallbackUrl)
  }

  try {
    const config = await getPaymentConfig()
    const appId = String(config.alipay?.appId || '').trim()
    const privateKey = normalizePem(config.alipay?.privateKey)
    const alipayPublicKey = normalizePem(config.alipay?.publicKey)
    if (!appId || !privateKey || !alipayPublicKey) {
      throw new Error('alipay_not_configured')
    }

    const sdk = new AlipaySdk({
      appId,
      privateKey,
      alipayPublicKey,
      gateway: 'https://openapi.alipay.com/gateway.do',
      signType: 'RSA2',
      timeout: 5000,
    })

    if (params.sign && !sdk.checkNotifySign(params)) {
      console.warn('[AlipayReturn] return signature verification failed, falling back to trade query')
    }

    const result: any = await sdk.exec(
      'alipay.trade.query',
      { bizContent: { outTradeNo: orderNo } },
      { validateSign: true }
    )
    const tradeStatus = result?.tradeStatus || result?.trade_status
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      await fulfillPaidOrder(orderNo, 'alipay')
      fallbackUrl.searchParams.set('payment', 'success')
    } else {
      fallbackUrl.searchParams.set('payment', 'pending')
    }
  } catch (error) {
    console.error('[AlipayReturn] confirmation failed:', error)
    fallbackUrl.searchParams.set('payment', 'confirm_failed')
  }

  fallbackUrl.searchParams.set('orderNo', orderNo)
  return NextResponse.redirect(fallbackUrl)
}
