import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const backendPort = process.env.TOKEN_SYNC_BACKEND_PORT || process.env.LOCAL_BACKEND_PORT || '3001'
    const target = `http://127.0.0.1:${backendPort}/user/status`
    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => {
      if (k.toLowerCase() !== 'host') headers[k] = v
    })
    const res = await fetch(target, {
      method: 'GET',
      headers,
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

