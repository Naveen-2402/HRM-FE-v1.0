import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from "jwt-decode";
import { UserProfile } from "@/store/useAuthStore";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const currentPath = url.pathname;

  // --- 1. ROLE-BASED ACCESS CONTROL (RBAC) ---

  // Note: Matching '/dashboard/employees' automatically covers '/dashboard/employees/invite'
  const adminPaths = ['/dashboard/employees', '/dashboard/auth'];
  const isProtectedPath = adminPaths.some(path => currentPath.startsWith(path));

  if (isProtectedPath) {
    // Note: Adjust the cookie name ('auth_token', 'token', 'access_token') based on what setAuthToken() actually uses
    const token = req.cookies.get('auth_token')?.value || req.cookies.get('token')?.value;

    if (!token) return NextResponse.redirect(new URL('/login', req.url));

    try {
      // Use your preferred package here!
      const decodedUser = jwtDecode<UserProfile>(token);
      const isAdmin = decodedUser?.realm_access?.roles?.includes("tenant-admin");

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // --- 2. SUBDOMAIN ROUTING (Your existing logic) ---

  // Define your base domain for local development and production  
  let baseDomain = `${process.env.NEXT_PUBLIC_HOSTED_DOMAIN}`; // Production default
  if (hostname.includes(`${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}`)) {
    baseDomain = `${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}:3000`; // Local testing
  }

  // Determine if the current request is on a subdomain
  const isSubdomain = hostname !== baseDomain && hostname.endsWith(`.${baseDomain}`);

  if (isSubdomain) {
    // Extract the tenant string (e.g., 'dovel' from 'dovel.hrm.com' or 'dovel.localhost:3000')
    const tenantSubdomain = hostname.replace(`.${baseDomain}`, '');

    // Silently rewrite the URL to point to the /[tenant]/... folder
    // The user's browser URL stays exactly the same (e.g., dovel.hrm.com/dashboard)
    return NextResponse.rewrite(new URL(`/${tenantSubdomain}${url.pathname}${url.search}`, req.url));
  }

  // If there's no subdomain (it's just hrm.com), let it load normally from the (root) folder
  return NextResponse.next();
}

// Ensure the middleware only runs on actual page routes, not static files or images
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};