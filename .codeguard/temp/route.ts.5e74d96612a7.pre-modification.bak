import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fulfillPaidOrder } from '@/lib/paymentFulfillment'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const orderId = body?.orderId
    const orderNo = body?.orderNo || body?.payment_id || ''
    
    if (!orderId && !orderNo) {
      return NextResponse.json({ success: false, error: 'missing_order_info' }, { status: 400 })
    }
    
    // 优先使用 orderId 查询，其次使用 orderNo
    const order = await prisma.order.findUnique({ 
      where: orderId ? { id: orderId } : { orderNo } 
    })
    
    if (!order) {
      return NextResponse.json({ success: false, error: 'order_not_found' }, { status: 404 })
    }

    if (order.status === 'paid') {
      await fulfillPaidOrder(order.orderNo, order.paymentMethod || 'alipay')
    }
    
    return NextResponse.json({ 
      success: true, 
      status: order.status,
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.amount,
      paymentTime: order.paymentTime
    })
  } catch (error) {
    console.error('查询支付状态错误:', error)
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
