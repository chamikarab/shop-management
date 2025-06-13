import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;

  // If access_token is missing, try refreshing it
  if (!accessToken) {
    const refreshResponse = await fetch(`${req.nextUrl.origin}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    if (refreshResponse.ok) {
      // Allow request to proceed
      return NextResponse.next();
    } else {
      // Redirect to login if refresh fails
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Allow access if token is present
  return NextResponse.next();
}
export const config = {
  matcher: ['/admin/:path*'], // 🔐 Apply only to admin pages (or adjust as needed)
};