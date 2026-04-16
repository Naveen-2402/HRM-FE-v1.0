import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { UserProfile } from '@/store/useAuthStore';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
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

  // --- 1. EARLY TOKEN DECODING ---
  const token = req.cookies.get('auth_token')?.value;
  let decodedToken: UserProfile | null = null;

  if (token) {
    try {
      decodedToken = jwtDecode<UserProfile>(token);
    } catch {
      console.error('[middleware] Invalid token format');
    }
  }

  // --- 2. SUBDOMAIN ROUTING & TENANT VERIFICATION ---
  const isSubdomain =
    hostWithoutPort !== rootHostname && hostWithoutPort?.endsWith(`.${rootHostname}`);
  let tenant: string | undefined = undefined;

  if (isSubdomain) {
    tenant = hostWithoutPort?.replace(`.${rootHostname}`, '');

    // If a user is logged in, verify their token authorizes them for this subdomain
    if (decodedToken) {
      const userOrgs: any = decodedToken.organization || [];
      const belongsToTenant = userOrgs.includes(tenant);

      if (!belongsToTenant) {
        // Redirect the user to their actual assigned tenant
        if (userOrgs.length > 0) {
          const correctTenant = userOrgs[0];
          url.hostname = `${correctTenant}.${rootHostname}`;
          return NextResponse.redirect(url);
        }

        // Fallback: If they have no organizations, redirect to root login
        url.hostname = rootHostname;
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    }
  }

  // --- 3. GENERAL AUTH PROTECTION & ADMIN RBAC ---
  if (currentPath.startsWith('/dashboard')) {
    // If accessing a protected route without a valid token, redirect to login
    if (!token || !decodedToken) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const adminPaths = ['/dashboard/employees', '/dashboard/auth'];
    const isAdminPath = adminPaths.some(p => currentPath.startsWith(p));

    if (isAdminPath) {
      const isAdmin = decodedToken.realm_access?.roles?.includes('tenant-admin');
      if (!isAdmin) {
        // Not an admin, bounce them back to the general dashboard
        const redirectUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // --- 4. APPLY SUBDOMAIN REWRITE ---
  // Apply the folder rewrite only after all security and tenant checks pass
  if (isSubdomain && tenant) {
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