// // middleware.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(request: NextRequest) {
//   const url = request.nextUrl.clone();

//   // 1. Get the hostname (e.g., 'dovel.hrm.com', 'localhost:3000', or 'dovel.localhost:3000')
//   const hostname = request.headers.get("host") || "";

//   // 2. Define your root domain (use localhost for local development)
//   const rootDomain = process.env.NODE_ENV === "production" 
//     ? "hrm.com" 
//     : "localhost:3000";

//   // 3. Extract the subdomain
//   // If the hostname is 'dovel.hrm.com', the currentHost is 'dovel'
//   // If the hostname is 'hrm.com', the currentHost is 'hrm.com'
//   const currentHost = hostname.replace(`.${rootDomain}`, "");

//   // 4. If there is no subdomain (meaning it's the root domain 'hrm.com')
//   // Let the request pass through to your standard public pages (e.g., landing page, onboarding)
//   if (currentHost === rootDomain || currentHost === hostname) {
//     return NextResponse.next();
//   }

//   // 5. If there IS a subdomain (e.g., 'dovel'), rewrite the URL
//   // We rewrite the path to map to our dynamic [tenant] folder
//   // Example: dovel.hrm.com/dashboard -> /dovel/dashboard
//   url.pathname = `/${currentHost}${url.pathname}`;

//   return NextResponse.rewrite(url);
// }

// // Ensure the middleware only runs on actual pages, not static assets or API routes
// export const config = {

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Define your base domain for local development and production  
  let baseDomain = 'hrm.com'; // Production default
  if (hostname.includes('hrm.test')) {
    baseDomain = 'hrm.test:3000'; // Local testing
  } else if (hostname.includes('localhost')) {
    baseDomain = 'localhost:3000'; // Fallback
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