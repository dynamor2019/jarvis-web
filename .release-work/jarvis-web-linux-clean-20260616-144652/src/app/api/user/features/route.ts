import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

type Toggles = Record<string, boolean>
const userFeatures: Map<string, Toggles> = (globalThis as any).userFeatures || new Map()
;(globalThis as any).userFeatures = userFeatures

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
    const payload = verifyToken(token)
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const cur = userFeatures.get(payload.userId) || {}
    return NextResponse.json({ success: true, toggles: cur })
  } catch {
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
    const payload = verifyToken(token)
    if (!payload?.userId) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    const body = await req.json()
    const toggles = body?.toggles || {}
    if (typeof toggles !== 'object') return NextResponse.json({ success: false, error: 'bad_request' }, { status: 400 })
    userFeatures.set(payload.userId, toggles as Toggles)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 })
  }
}

