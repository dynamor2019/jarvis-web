import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureStoreTables } from '@/lib/dbMigrate'
import { verifyToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = bearer ? verifyToken(bearer) : null
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const admin = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!admin || admin.role !== 'admin') return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })
    if (process.env.ADMIN_MIGRATE_ENABLED !== '1') return NextResponse.json({ success: false, error: 'migrate_disabled' }, { status: 403 })
    const res = await ensureStoreTables()
    return NextResponse.json({ success: true, result: res })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
