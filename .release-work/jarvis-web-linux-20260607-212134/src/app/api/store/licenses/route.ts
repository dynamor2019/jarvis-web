import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { StoreRepo } from '@/lib/storeRepo'

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    let payload = bearer ? verifyToken(bearer) : null

    if (!payload && process.env.NODE_ENV === 'development') {
        payload = { userId: 'mock-dev-user' }
    }

    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const list = await StoreRepo.listLicenses(payload.userId)
    return NextResponse.json({ success: true, licenses: list })
  } catch {
    return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
  }
}
