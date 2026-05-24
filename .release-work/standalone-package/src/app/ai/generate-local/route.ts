import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const backendPort = process.env.TOKEN_SYNC_BACKEND_PORT || process.env.LOCAL_BACKEND_PORT || '37641'
    const target = `http://127.0.0.1:${backendPort}/ai/generate-local`
    
    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => { 
        // Do not forward host header to avoid confusion
        if (k.toLowerCase() !== 'host') headers[k] = v 
    })
    
    const body = await request.text()
    
    const res = await fetch(target, { 
        method: 'POST', 
        headers, 
        body,
        cache: 'no-store'
    })
    
    if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ 
            error: `Backend Error (${res.status}): ${errorText}` 
        }, { status: res.status })
    }

    // Handle streaming or JSON response
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('text/event-stream')) {
        return new NextResponse(res.body, {
            status: res.status,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    
    return NextResponse.json({ 
        error: `Failed to connect to local backend: ${e?.message || 'Unknown error'}. Please ensure the Jarvis Backend Service is running on port 37641.` 
    }, { status: 500 })
  }
}

