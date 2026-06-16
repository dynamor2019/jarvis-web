import { NextResponse } from 'next/server'

const releases: Record<string, string[]> = {
  'core-write': ['1.0.0', '1.0.1', '1.1.0'],
}

function cmp(a: string, b: string) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] || 0
    const vb = pb[i] || 0
    if (va !== vb) return va - vb
  }
  return 0
}

export async function POST(req: Request) {
  try {
    if (process.env.STORE_UPDATES_ENABLED !== '1') return NextResponse.json({ success: false, error: 'updates_disabled' }, { status: 404 })
    const body = await req.json()
    const pluginId = body?.plugin_id || ''
    const current = body?.current_version || ''
    if (!pluginId || !current) return NextResponse.json({ success: false, error: 'missing_params' }, { status: 400 })
    const list = releases[pluginId] || []
    const latest = list[list.length - 1] || '1.0.0'
    const need = cmp(latest, current) > 0
    return NextResponse.json({ success: true, latest_version: latest, need_update: need })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
