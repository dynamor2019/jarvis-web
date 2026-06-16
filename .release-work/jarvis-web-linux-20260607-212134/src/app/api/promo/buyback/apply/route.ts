import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

type RecordItem = { type: 'buyback'; points: number; price?: number; status?: string; ts: number }
const promoRecords: Map<string, Array<RecordItem>> = (globalThis as any).promoRecords || new Map()
;(globalThis as any).promoRecords = promoRecords
const promoFreezeUntil: Map<string, number> = (globalThis as any).promoFreezeUntil || new Map()
;(globalThis as any).promoFreezeUntil = promoFreezeUntil
const promoMonthly: Map<string, { transfer: number; buyback: number }> = (globalThis as any).promoMonthly || new Map()
;(globalThis as any).promoMonthly = promoMonthly

function monthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()+1}`
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '') || ''
    if (!auth) return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    const payload = verifyToken(auth)
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'Token 无效' }, { status: 401 })

    const body = await req.json()
    const points = Number(body?.points || 0)
    if (!Number.isFinite(points) || points <= 0) return NextResponse.json({ success: false, error: '积分数量不合法' }, { status: 400 })
    const fu = promoFreezeUntil.get(payload.userId) || 0
    if (fu && Date.now() < fu) return NextResponse.json({ success: false, error: 'frozen' }, { status: 429 })
    const mk = `${payload.userId}:${monthKey()}`
    const mm = promoMonthly.get(mk) || { transfer: 0, buyback: 0 }
    if (mm.buyback + points > 20000) return NextResponse.json({ success: false, error: '单月回购上限为2万积分' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 })
    const referredUsers = await prisma.user.findMany({ where: { referredBy: user.id } })

    const reasons: string[] = []
    if (referredUsers.length < 20) reasons.push('累计有效用户需≥20')
    const items = promoRecords.get(user.id) || []
    const transfers = items.filter(i => (i as any).type === 'transfer')
    const earliest = referredUsers.length ? Math.min(...referredUsers.map(u => u.createdAt.getTime())) : 0
    const days180 = 180 * 24 * 60 * 60 * 1000
    if (!earliest || Date.now() - earliest < days180) reasons.push('积分发放需满180天未使用/未转让')
    const recentTransfer = transfers.some(t => Date.now() - t.ts < days180)
    if (recentTransfer) reasons.push('近180天存在积分转让记录')
    const violations = 0
    if (violations > 0) reasons.push('近90天存在违规记录')

    if (reasons.length) return NextResponse.json({ success: false, error: reasons.join('；') }, { status: 400 })

    const price = points * 0.05
    const arr = items
    arr.push({ type: 'buyback', points, price, status: 'pending', ts: Date.now() })
    promoRecords.set(user.id, arr)
    mm.buyback += points
    promoMonthly.set(mk, mm)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}
