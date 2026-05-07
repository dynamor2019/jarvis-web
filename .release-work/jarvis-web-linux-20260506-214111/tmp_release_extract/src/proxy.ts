import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const { nextUrl, headers } = request
  const pathname = nextUrl.pathname

  const response = NextResponse.next()
  const accept = headers.get('accept') || ''
  const isRsc = headers.has('rsc')
  // Prevent stale HTML/RSC from using invalidated Server Action IDs after deployment.
  if (accept.includes('text/html') || isRsc) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // Ignore Vite client paths if present
  if (pathname.startsWith('/@vite/')) {
    return new NextResponse(null, { status: 204 })
  }

  // Guard AirRibbon route to only allow Word WebView usage in strict mode
  if (pathname === '/airribbon') {
    const mode = (process.env.AIRRIBBON_GUARD || 'off').toLowerCase()
    if (mode === 'strict') {
      const ua = (headers.get('user-agent') || '').toLowerCase()
      const wvParam = nextUrl.searchParams.get('wv') === '1'
      const hasSig = nextUrl.searchParams.has('sig')
      const isWebViewHeuristic = ua.includes('webview') || ua.includes('wv') || ua.includes('edg/')
      if (!(wvParam || hasSig || isWebViewHeuristic)) {
        return new NextResponse('forbidden', { status: 403 })
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)', '/@vite/:path*', '/airribbon'],
}
