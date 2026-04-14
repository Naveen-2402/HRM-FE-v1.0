import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { UserProfile } from '@/store/useAuthStore';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const hostWithoutPort = hostname.split(':')[0];
  const currentPath = url.pathname;

  const rawDomain = process.env.NEXT_PUBLIC_DOMAIN;
  if (!rawDomain) {
    console.error('[middleware] Missing NEXT_PUBLIC_DOMAIN');
    return NextResponse.next();
  }

  const domainUrl = new URL(rawDomain);
  const rootHostname = domainUrl.hostname;
  const rootPort = domainUrl.port;
  const baseDomain = rootPort ? `${rootHostname}:${rootPort}` : rootHostname;

  // --- 1. GENERAL AUTH PROTECTION ---
  if (currentPath.startsWith('/dashboard')) {
    const token = req.cookies.get('auth_token')?.value;
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
    hostWithoutPort !== rootHostname && hostWithoutPort?.endsWith(`.${rootHostname}`);

  if (isSubdomain) {
    const tenant = hostWithoutPort?.replace(`.${rootHostname}`, '');
    return NextResponse.rewrite(
      new URL(`/${tenant}${currentPath}${url.search}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};