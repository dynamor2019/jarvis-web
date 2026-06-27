import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const counters: Record<string, number> = (globalThis as any).storeCounters || { receipts: 0, downloads: 0, installs: 0 }
;(globalThis as any).storeCounters = counters

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = bearer ? verifyToken(bearer) : null
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    return NextResponse.json({ success: true, counters })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
