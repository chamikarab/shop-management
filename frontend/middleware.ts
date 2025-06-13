import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;

  // ✅ If access token is missing, attempt to refresh it
  if (!accessToken) {
    try {
      const refreshResponse = await fetch(`${req.nextUrl.origin}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          // Forward cookies for refresh token
          cookie: req.headers.get('cookie') || '',
        },
      });

      if (refreshResponse.ok) {
        // ✅ Proceed if token refreshed successfully
        return NextResponse.next();
      } else {
        console.warn('❌ Refresh failed, redirecting to login');
        return NextResponse.redirect(new URL('/login', req.url));
      }
    } catch (err) {
      console.error('❌ Refresh error:', err);
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // ✅ Token exists, allow access
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'], // 🔐 Restrict middleware to admin routes
};