import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET!;

// Define which routes require which permissions
const protectedRoutes: Record<string, string> = {
  '/admin/dashboard': 'dashboard:access',
  '/admin/products': 'products:view',
  '/admin/products/add': 'products:add',
  '/admin/products/purchasing': 'products:purchasing',
  '/admin/products/pricing': 'products:purchasing',
  '/admin/users': 'users:view',
  '/admin/users/add': 'users:add',
  '/admin/orders': 'orders:view',
};

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;
  const pathname = req.nextUrl.pathname;

  // Determine required permissions for the current route
  const requiredPermissions = Object.entries(protectedRoutes).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  // No access token — try refreshing
  if (!accessToken) {
    try {
      const refreshResponse = await fetch(`${req.nextUrl.origin}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      });

      if (refreshResponse.ok) {
        return NextResponse.next();
      } else {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Decode token and check permissions
  try {
    const payload: any = jwt.verify(accessToken, secret);
    const userPermissions = payload.permissions || [];

    if (
      requiredPermissions &&
      !userPermissions.includes(requiredPermissions)
    ) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};