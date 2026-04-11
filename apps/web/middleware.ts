import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { UserProfile } from '@/store/useAuthStore';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const currentPath = url.pathname;

  const hostedDomain = process.env.NEXT_PUBLIC_HOSTED_DOMAIN;
  const localDomain = process.env.NEXT_PUBLIC_LOCAL_DOMAIN;

  if (!hostedDomain || !localDomain) {
    console.error('[middleware] Missing NEXT_PUBLIC_HOSTED_DOMAIN or NEXT_PUBLIC_LOCAL_DOMAIN');
    return NextResponse.next();
  }

  // --- Resolve base domain ---
  let baseDomain = hostedDomain;
  if (hostname.includes(localDomain)) {
    const port = hostname.split(':')[1];
    baseDomain = port ? `${localDomain}:${port}` : localDomain;
  }

  // --- 1. GENERAL AUTH PROTECTION ---
  if (currentPath.startsWith('/dashboard')) {
    const token = req.cookies.get('auth_token')?.value
    if (!token) return NextResponse.redirect(new URL('/login', req.url));

    // --- 2. ADMIN-ONLY RBAC ---
    const adminPaths = ['/dashboard/employees', '/dashboard/auth'];
    const isAdminPath = adminPaths.some(p => currentPath.startsWith(p));

    if (isAdminPath) {
      try {
        const decoded = jwtDecode<UserProfile>(token);
        const isAdmin = decoded?.realm_access?.roles?.includes('tenant-admin');
        if (!isAdmin) return NextResponse.redirect(new URL('/dashboard', req.url));
      } catch {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }
  }

  // --- 3. SUBDOMAIN ROUTING ---
  const isSubdomain =
    hostname !== baseDomain && hostname.endsWith(`.${baseDomain}`);

  if (isSubdomain) {
    const tenant = hostname.replace(`.${baseDomain}`, '');
    return NextResponse.rewrite(
      new URL(`/${tenant}${url.pathname}${url.search}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};