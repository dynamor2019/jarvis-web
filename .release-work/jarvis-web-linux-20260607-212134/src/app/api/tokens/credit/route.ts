import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = bearer ? verifyToken(bearer) : null
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    
    const body = await request.json()
    const amount = Number(body?.tokens || 0)
    const orderId = body?.orderId
    
    // Require orderId for safety/idempotency
    if (!orderId) {
        return NextResponse.json({ success: false, error: 'order_id_required' }, { status: 400 })
    }

    if (!amount || amount <= 0) return NextResponse.json({ success: false, error: 'bad_amount' }, { status: 400 })
    
    // Check if transaction already exists for this order
    const existingTx = await prisma.transaction.findFirst({
        where: { 
            description: { contains: orderId },
            type: 'token_credit'
        }
    })
    
    if (existingTx) {
        return NextResponse.json({ success: true, message: 'already_processed' })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return NextResponse.json({ success: false, error: 'user_not_found' }, { status: 404 })
    
    const updated = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        trafficTokenBalance: (user.trafficTokenBalance || 0) + amount,
        tokenBalance: (user.trafficTokenBalance || 0) + amount + (user.subscriptionTokenBalance || 0)
      }
    })
    await prisma.transaction.create({ data: { userId: payload.userId, type: 'token_credit', amount, balance: updated.tokenBalance, description: body?.description || `token_credit_${orderId}`, paymentMethod: body?.paymentMethod || 'store', status: 'completed' } })
    
    return NextResponse.json({
      success: true,
      balance: updated.tokenBalance,
      trafficBalance: updated.trafficTokenBalance,
      subscriptionBalance: updated.subscriptionTokenBalance
    })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
