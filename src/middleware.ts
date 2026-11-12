import { NextRequest, NextResponse } from 'next/server'

/**
 * Edge middleware — runs before every request reaches a route handler.
 *
 * This is the first line of defence: if the session cookie is absent or
 * expired, the request is redirected to sign-in before it ever reaches a
 * server component. Individual pages still call `requireUser()` which
 * performs the full HMAC signature verification and employee lookup —
 * this middleware only checks cookie presence and expiry so it stays
 * lightweight on the Edge Runtime (no node:crypto needed).
 *
 * Keeping the check here means a new page is protected by default:
 * forgetting to add `requireUser()` does not expose it.
 */

const COOKIE_NAME = 'regen.session'

const PUBLIC_PATHS = new Set(['/', '/favicon.svg'])

function hasValidSessionCookie(token: string | undefined): boolean {
  if (!token) return false

  // Cookie format: base64url(payload).base64url(signature)
  const [payload] = token.split('.')
  if (!payload) return false

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string
      exp?: number
    }
    // Must have a subject and a non-expired timestamp.
    if (!decoded.sub || !decoded.exp) return false
    if (decoded.exp < Date.now()) return false
    return true
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets and the sign-in page are always public.
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/_next/') || pathname.startsWith('/icon')) {
    return NextResponse.next()
  }

  // Everything under /portal requires a valid session cookie.
  if (pathname.startsWith('/portal')) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!hasValidSessionCookie(token)) {
      const signInUrl = new URL('/', request.url)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except static assets handled by Next.js itself.
  matcher: ['/((?!_next/static|_next/image|favicon.svg|icon).*)'],
}
