import { AlipaySdk } from 'alipay-sdk'
import { getPaymentConfig } from '@/lib/config'
import { fulfillPaidOrder } from '@/lib/paymentFulfillment'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const body = rawBody.includes('=') ? Object.fromEntries(new URLSearchParams(rawBody)) : JSON.parse(rawBody || '{}')

    // 验证支付宝签名，防止伪造回调
    try {
      const config = await getPaymentConfig()
      const appId = config.alipay?.appId
      const privateKey = config.alipay?.privateKey?.replace(/\\n/g, '\n').trim()
      const alipayPublicKey = config.alipay?.publicKey?.replace(/\\n/g, '\n').trim()
      if (appId && privateKey && alipayPublicKey) {
        const sdk = new AlipaySdk({ appId, privateKey, alipayPublicKey })
        if (!sdk.checkNotifySign(body)) {
          console.warn('[AlipayWebhook] signature verification failed')
          return new Response('fail', { status: 200 })
        }
      }
    } catch (signErr) {
      console.error('[AlipayWebhook] signature check error:', signErr)
    }

    const orderNo = body?.orderNo || body?.out_trade_no || ''
    if (!orderNo) return new Response('failure', { status: 400 })
    if (body?.trade_status && body.trade_status !== 'TRADE_SUCCESS' && body.trade_status !== 'TRADE_FINISHED') {
      return new Response('success')
    }
    const result = await fulfillPaidOrder(orderNo, 'alipay')
    return new Response(result.success ? 'success' : 'failure', { status: result.success ? 200 : 404 })
  } catch (error) {
    console.error('[AlipayWebhook] processing failed:', error)
    return new Response('failure', { status: 400 })
  }
}
