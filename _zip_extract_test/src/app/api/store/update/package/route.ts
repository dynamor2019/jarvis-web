import { NextResponse } from 'next/server'
import { StoreRepo } from '@/lib/storeRepo'
import { releaseFiles, diffFiles } from '@/lib/updateRepo'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    if (process.env.STORE_UPDATES_ENABLED !== '1') return NextResponse.json({ success: false, error: 'updates_disabled' }, { status: 404 })
    const token = url.searchParams.get('token') || ''
    const fromV = url.searchParams.get('from') || ''
    const toV = url.searchParams.get('to') || ''
    const meta = await StoreRepo.getToken(token)
    if (!meta) return new NextResponse('invalid_token', { status: 400 })
    if (Date.now() > meta.expires) return new NextResponse('expired', { status: 400 })
    const fromFiles = releaseFiles(meta.pluginId, fromV)
    const toFiles = releaseFiles(meta.pluginId, toV)
    const patches = diffFiles(fromFiles, toFiles)
    const patch = { plugin_id: meta.pluginId, from: fromV, to: toV, patches }
    return NextResponse.json({ success: true, patch })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
