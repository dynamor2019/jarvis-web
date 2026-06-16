import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

type RecordItem = { type: 'transfer'; points: number; discount?: number; status?: string; ts: number }
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
    const discount = Number(body?.discount || 0)
    if (!Number.isFinite(points) || points <= 0) return NextResponse.json({ success: false, error: '积分数量不合法' }, { status: 400 })
    if (!Number.isFinite(discount) || discount < 90 || discount > 97) return NextResponse.json({ success: false, error: '折扣需在90-97之间' }, { status: 400 })
    const fu = promoFreezeUntil.get(payload.userId) || 0
    if (fu && Date.now() < fu) return NextResponse.json({ success: false, error: 'frozen' }, { status: 429 })

    const mk = `${payload.userId}:${monthKey()}`
    const mm = promoMonthly.get(mk) || { transfer: 0, buyback: 0 }
    if (mm.transfer + points > 80000) return NextResponse.json({ success: false, error: '单月转让上限为8万积分' }, { status: 400 })

    const userId = payload.userId
    const arr = promoRecords.get(userId) || []
    arr.push({ type: 'transfer', points, discount, status: 'listing', ts: Date.now() })
    promoRecords.set(userId, arr)
    mm.transfer += points
    promoMonthly.set(mk, mm)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}
