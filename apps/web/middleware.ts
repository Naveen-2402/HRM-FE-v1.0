import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

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