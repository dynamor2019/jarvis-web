import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { queryInstallCounts } from '@/lib/auditRepo'

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = bearer ? verifyToken(bearer) : null
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const admin = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })
    const counters: Record<string, number> = (globalThis as any).storeCounters || { receipts: 0, downloads: 0, installs: 0 }
    const lastHour = await queryInstallCounts(60 * 60 * 1000)
    const lastDay = await queryInstallCounts(24 * 60 * 60 * 1000)
    return NextResponse.json({ success: true, counters, installs: { last_hour: lastHour.total, last_day: lastDay.total } })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
