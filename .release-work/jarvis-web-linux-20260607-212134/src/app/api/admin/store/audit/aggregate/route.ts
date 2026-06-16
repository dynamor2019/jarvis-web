import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { aggregateInstallLogs } from '@/lib/auditRepo'

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = bearer ? verifyToken(bearer) : null
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const admin = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })
    const url = new URL(req.url)
    const groupBy = (url.searchParams.get('group_by') || 'plugin') as 'user'|'plugin'
    const fromTs = url.searchParams.get('from_ts') ? Number(url.searchParams.get('from_ts')) : undefined
    const toTs = url.searchParams.get('to_ts') ? Number(url.searchParams.get('to_ts')) : undefined
    const agg = await aggregateInstallLogs({ groupBy, fromTs, toTs })
    return NextResponse.json({ success: true, group_by: groupBy, results: agg })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
