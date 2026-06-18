import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getClientAuthToken } from "@repo/utils";
import { UserProfile } from "@/store/useAuthStore";

export const useTenantRedirect = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get the current path (e.g., "/settings")

  const redirectToTenantDashboard = (targetPathOverride?: string) => {
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
        const ignoredPaths = [
          "/",
          "/login",
          "/signup",
          "/forgot-password",
          "/auth/callback",
          "/pricing",
          "/billing/success",
          "/billing/cancel",
        ];

        const shouldForceDashboard = !targetPathOverride && (pathname === null || ignoredPaths.includes(pathname));

        // Check if we are ALREADY on the correct subdomain
        if (currentHostname.startsWith(`${tenantSubdomain}.`)) {
          if (targetPathOverride) {
            router.push(targetPathOverride);
          } else if (shouldForceDashboard) {
            router.push("/dashboard");
          }
          return;
        }

        // We are on the WRONG domain. Rebuild the URL.
        const rawDomain = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
        const domainUrl = new URL(rawDomain);

        // FIX: Preserve their intended path when redirecting domains, default to dashboard
        let targetPath = "/dashboard";
        if (targetPathOverride) {
          targetPath = targetPathOverride;
        } else if (!shouldForceDashboard && pathname) {
          targetPath = pathname;
        }

        window.location.href = `${domainUrl.protocol}//${tenantSubdomain}.${domainUrl.host}${targetPath}`;
      } else {
        // Fallback
        const ignoredPaths = [
          "/",
          "/login",
          "/signup",
          "/forgot-password",
          "/auth/callback",
          "/pricing",
          "/billing/success",
          "/billing/cancel",
        ];
        const shouldForceDashboard = !targetPathOverride && (pathname === null || ignoredPaths.includes(pathname));

        if (targetPathOverride) {
          router.push(targetPathOverride);
        } else if (shouldForceDashboard) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Failed to decode token or redirect:", error);
    }
  };

  return { redirectToTenantDashboard };
};