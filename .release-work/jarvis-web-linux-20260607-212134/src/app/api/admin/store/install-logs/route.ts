import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { queryInstallLogs } from '@/lib/auditRepo'

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = bearer ? verifyToken(bearer) : null
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const admin = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId') || undefined
    const pluginId = url.searchParams.get('pluginId') || undefined
    const fromTs = url.searchParams.get('from_ts') ? Number(url.searchParams.get('from_ts')) : undefined
    const toTs = url.searchParams.get('to_ts') ? Number(url.searchParams.get('to_ts')) : undefined
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 50
    const offset = url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : 0
    const logs = await queryInstallLogs({ userId, pluginId, fromTs, toTs, limit, offset })
    return NextResponse.json({ success: true, logs })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
