import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const target = `${url.origin}/api/ai/get-key`
    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => { headers[k] = v })
    const res = await fetch(target, { method: 'GET', headers })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'proxy_error' }, { status: 500 })
  }
}

