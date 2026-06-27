import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const backendPort = process.env.TOKEN_SYNC_BACKEND_PORT || process.env.LOCAL_BACKEND_PORT || '37641'
    const target = `http://127.0.0.1:${backendPort}/tokens/sync`
    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => {
      if (k.toLowerCase() !== 'host') headers[k] = v
    })
    const body = await request.text()
    const res = await fetch(target, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    })
    const contentType = res.headers.get('content-type') || ''
    if (!res.ok) {
      if (contentType.includes('application/json')) {
        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
      }
      const text = await res.text()
      return NextResponse.json(
        { success: false, error: text || `Backend error ${res.status}` },
        { status: res.status },
      )
    }
    if (contentType.includes('application/json')) {
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: { 'content-type': contentType || 'text/plain' },
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Failed to connect to local backend' },
      { status: 500 },
    )
  }
}

