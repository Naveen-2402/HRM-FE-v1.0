import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getClientAuthToken } from "@repo/utils";
import { UserProfile } from "@/store/useAuthStore";

export const useTenantRedirect = () => {
  const router = useRouter();

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
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : "";
        const baseDomain = `${hostname}${port}`;

        window.location.href = `http://${tenantSubdomain}.${baseDomain}/dashboard`;
      } else {
        // Fallback
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to decode token or redirect:", error);
    }
  };

  return { redirectToTenantDashboard };
};