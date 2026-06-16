import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { StoreRepo } from '@/lib/storeRepo'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    let payload = bearer ? verifyToken(bearer) : null
    
    if (!payload && process.env.NODE_ENV === 'development') {
        payload = { userId: 'mock-dev-user' }
    }

    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const body = await req.json()
    const pluginId = body?.plugin_id || ''
    if (!pluginId) return NextResponse.json({ success: false, error: 'missing_plugin' }, { status: 400 })
    
    const list = await StoreRepo.listLicenses(payload.userId)
    const lic = list.find((x) => x.pluginId === pluginId)
    if (!lic) return NextResponse.json({ success: false, error: 'not_purchased' }, { status: 403 })
    
    const expires = Date.now() + 10 * 60 * 1000
    let token = nanoid(32)
    if (process.env.NODE_ENV === 'development') {
        token = 'mock-' + token;
    }
    await StoreRepo.saveToken(token, { userId: payload.userId, pluginId, expires, consumed: false })
    
    return NextResponse.json({ success: true, download_token: token, expires_at: expires })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
