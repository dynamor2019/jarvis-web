import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { writeInstallLog } from '@/lib/auditRepo'

const installLogs: Array<{ userId: string; pluginId: string; status: string; reason?: string; ts: number }> = (globalThis as any).installLogs || []
;(globalThis as any).installLogs = installLogs

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = bearer ? verifyToken(bearer) : null
    const body = await req.json()
    const pluginId = body?.plugin_id || ''
    const status = body?.status || ''
    const reason = body?.reason || ''
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    if (!pluginId || !status) return NextResponse.json({ success: false, error: 'missing_params' }, { status: 400 })
    const ts = Date.now()
    installLogs.push({ userId: payload.userId, pluginId, status, reason, ts })
    await writeInstallLog(payload.userId, pluginId, status, reason, ts)
    const counters: Record<string, number> = (globalThis as any).storeCounters || { receipts: 0, downloads: 0, installs: 0 }
    if (status === 'installed') counters.installs = (counters.installs || 0) + 1
    ;(globalThis as any).storeCounters = counters
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ success: true, logs: installLogs })
}
