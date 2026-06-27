import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const channel = body?.channel || 'mock'
    const port = process.env.PORT || '3000'
    const internalBaseUrl = `http://127.0.0.1:${port}`
    
    let authHeader = req.headers.get('authorization') || ''

    // 开发环境且未提供认证头时，注入一个占位 Token，
    // 让 /api/payment/create-order 走 mock-dev-user 逻辑，便于本地虚拟交易联调
    if (!authHeader && process.env.NODE_ENV === 'development') {
      authHeader = 'Bearer dev-mock-token'
    }

    const res = await fetch(`${internalBaseUrl}/api/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({
        orderType: body?.meta?.orderType || 'plugin',
        productName: body?.plugin_id || 'plugin',
        amount: body?.meta?.amount || 0,
        tokens: body?.meta?.tokens,
        duration: body?.meta?.duration || 0,
        modelType: body?.meta?.modelType, // 添加模型类型
      })
    })
    const data = await res.json()
    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: res.status === 401 ? '登录已过期，请重新登录' : data?.error || 'create_failed' },
        { status: res.status >= 400 ? res.status : 400 }
      )
    }
    const paymentId = data?.order?.orderNo || data?.payment_id || `${Date.now()}`
    return NextResponse.json({ success: true, payment_id: paymentId })
  } catch (error) {
    console.error('Store pay error:', error)
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
