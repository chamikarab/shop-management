import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET!;

const SUPER_ADMIN_ROLE = 'super_admin';

// Define which routes require which permissions
const protectedRoutes: Record<string, string> = {
  '/admin/dashboard': 'dashboard:access',
  '/admin/billing': 'billing:access',
  '/admin/expenses': 'expenses:view',
  '/admin/products': 'products:view',
  '/admin/products/add': 'products:add',
  '/admin/products/purchasing': 'products:purchase_products',
  '/admin/products/pricing': 'products:purchase_pricing',
  '/admin/users': 'users:view',
  '/admin/users/add': 'users:add',
  '/admin/orders': 'orders:view',
  '/admin/reports': 'reports:view',
};

function expandPermissionsForAccessCheck(permissions: string[] = []): string[] {
  const expanded = new Set(permissions);

  if (expanded.has('products:purchasing')) {
    expanded.delete('products:purchasing');
    expanded.add('products:purchase_products');
    expanded.add('products:purchase_pricing');
  }

  return Array.from(expanded);
}

function hasPermissionInList(
  userPermissions: string[],
  required: string
): boolean {
  if (!userPermissions?.length) return false;
  return expandPermissionsForAccessCheck(userPermissions).includes(required);
}

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;
  const pathname = req.nextUrl.pathname;

  const requiredPermissions = Object.entries(protectedRoutes)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1];

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
      }

      return NextResponse.redirect(new URL('/login', req.url));
    } catch {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  try {
    const payload = jwt.verify(accessToken, secret) as {
      role?: string;
      permissions?: string[];
    };
    const userPermissions = payload.permissions || [];

    if (payload.role === SUPER_ADMIN_ROLE) {
      return NextResponse.next();
    }

    if (pathname === '/admin' || pathname === '/admin/') {
      if (!hasPermissionInList(userPermissions, 'dashboard:access')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
      return NextResponse.next();
    }

    if (
      /^\/admin\/products\/[^/]+$/.test(pathname) &&
      !pathname.startsWith('/admin/products/add') &&
      !pathname.startsWith('/admin/products/purchasing') &&
      !pathname.startsWith('/admin/products/pricing')
    ) {
      if (!hasPermissionInList(userPermissions, 'products:edit')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
      return NextResponse.next();
    }

    if (
      requiredPermissions &&
      !hasPermissionInList(userPermissions, requiredPermissions)
    ) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
