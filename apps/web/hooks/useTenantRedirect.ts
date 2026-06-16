// import { useRouter } from "next/navigation";
// import { jwtDecode } from "jwt-decode";
// import { getClientAuthToken } from "@repo/utils";
// import { UserProfile } from "@/store/useAuthStore";

// export const useTenantRedirect = () => {
//   const router = useRouter();

//   const redirectToTenantDashboard = () => {
//     const token = getClientAuthToken();

//     if (!token) {
//       console.log("Token not found");
//       return;
//     }

//     try {
//       // 1. Decode the Keycloak JWT
//       const decodedUser = jwtDecode<UserProfile>(token);

//       // 2. Extract the Tenant Subdomain alias
//       let tenantSubdomain = "";
//       const orgClaim = decodedUser.organization;

//       if (Array.isArray(orgClaim) && orgClaim.length > 0) {
//         tenantSubdomain = orgClaim[0];
//       }

//       // 3. Redirect to the correct subdomain
//       if (tenantSubdomain) {
//         const hostname = window.location.hostname;
//         const port = window.location.port ? `:${window.location.port}` : "";
//         const baseDomain = `${hostname}${port}`;

//         window.location.href = `http://${tenantSubdomain}.${baseDomain}/dashboard`;
//       } else {
//         // Fallback
//         router.push("/dashboard");
//       }
//     } catch (error) {
//       console.error("Failed to decode token or redirect:", error);
//     }
//   };

//   return { redirectToTenantDashboard };
// };

import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getClientAuthToken } from "@repo/utils";
import { UserProfile } from "@/store/useAuthStore";

export const useTenantRedirect = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get the current path (e.g., "/settings")

  const redirectToTenantDashboard = () => {
    const token = getClientAuthToken();

    if (!token) {
      console.log("Token not found");
      return;
    }

    try {
      // 1. Decode the Keycloak JWT
      const decodedUser = jwtDecode<UserProfile>(token);

      // 2. Extract the Tenant Subdomain alias
      let tenantSubdomain = "";
      const orgClaim = decodedUser.organization;

      if (Array.isArray(orgClaim) && orgClaim.length > 0) {
        tenantSubdomain = orgClaim[0];
      }

      // 3. Redirect to the correct subdomain
      if (tenantSubdomain) {
        const currentHostname = window.location.hostname;

        // Check if we are ALREADY on the correct subdomain
        if (currentHostname.startsWith(`${tenantSubdomain}.`)) {
          // FIX: Only push to dashboard if they are on the root or login page.
          // If they are on /settings, let them stay there!
          if (pathname === "/" || pathname === "/login") {
            router.push("/dashboard");
          }
          return;
        }

        // We are on the WRONG domain. Rebuild the URL.
        const rawDomain = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
        const domainUrl = new URL(rawDomain);

        // FIX: Preserve their intended path when redirecting domains, default to dashboard
        const targetPath = (pathname && pathname !== '/' && pathname !== '/login')
          ? pathname
          : '/dashboard';

        window.location.href = `${domainUrl.protocol}//${tenantSubdomain}.${domainUrl.host}${targetPath}`;
      } else {
        // Fallback
        if (pathname === "/" || pathname === "/login") {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Failed to decode token or redirect:", error);
    }
  };

  return { redirectToTenantDashboard };
};