import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

type RecordItem = { type: 'grant'|'transfer'|'buyback'; points: number; discount?: number; price?: number; status?: string; ts: number }

const promoRecords: Map<string, Array<RecordItem>> = (globalThis as any).promoRecords || new Map()
;(globalThis as any).promoRecords = promoRecords
const promoFreezeUntil: Map<string, number> = (globalThis as any).promoFreezeUntil || new Map()
;(globalThis as any).promoFreezeUntil = promoFreezeUntil

function aggregateSeries(items: Array<RecordItem>, period: 'day'|'week'|'month') {
  const buckets: Map<string, number> = new Map()
  const fmt = (d: Date) => {
    if (period === 'day') return `${d.getMonth()+1}/${d.getDate()}`
    if (period === 'week') {
      const first = new Date(d)
      const day = first.getDay() || 7
      first.setDate(first.getDate() - day + 1)
      return `${first.getMonth()+1}/${first.getDate()}周`
    }
    return `${d.getFullYear()}-${d.getMonth()+1}`
  }
  for (const it of items) {
    const k = fmt(new Date(it.ts))
    buckets.set(k, (buckets.get(k) || 0) + (it.points || 0))
  }
  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }))
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '') || ''
    if (!auth) return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    const payload = verifyToken(auth)
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'Token 无效' }, { status: 401 })

    const url = new URL(req.url)
    const period = (url.searchParams.get('period') as 'day'|'week'|'month') || 'day'
    const withRecords = url.searchParams.get('records') === '1'

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 })

    const referredUsers = await prisma.user.findMany({ where: { referredBy: user.id }, orderBy: { createdAt: 'desc' } })
    const totalRef = referredUsers.length
    const effective = totalRef

    const points = (user as any).tokenBalance ?? 0
    const transferable = Math.min(points, 80000)
    const buybackable = Math.min(points, 20000)

    const items = promoRecords.get(user.id) || []
    const series = aggregateSeries(items, period)

    const today = new Date()
    const todayCount = referredUsers.filter(u => {
      const d = u.createdAt
      return d.getFullYear()===today.getFullYear() && d.getMonth()===today.getMonth() && d.getDate()===today.getDate()
    }).length

  const alerts: string[] = []
  if (todayCount >= 20) alerts.push('今日拉新≥20，触发阈值，积分发放将自动冻结')
  if (todayCount >= 20) promoFreezeUntil.set(user.id, Date.now() + 24 * 60 * 60 * 1000)
  const fu = promoFreezeUntil.get(user.id) || 0
  if (fu && Date.now() < fu) alerts.push('当前账号处于冻结期，部分操作不可用')

    const res: any = {
      success: true,
      totals: { referred: totalRef, effective, points, transferable, buybackable },
      series,
      alerts
    }

  if (withRecords) res.records = items.slice().sort((a, b) => b.ts - a.ts).slice(0, 200)
  return NextResponse.json(res)
  } catch {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}
