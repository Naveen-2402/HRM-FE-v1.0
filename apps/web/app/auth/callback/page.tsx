"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { setAuthToken } from "@repo/utils";
import { useAuthStore, UserProfile } from "@/store/useAuthStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const [error, setError] = useState<string | null>(null);
  
  // A ref to prevent React Strict Mode from firing the exchange twice
  const hasFetched = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("No authorization code found in the URL.");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    // React Strict Mode calls useEffect twice in development. 
    // If we send the code twice, Keycloak throws an "invalid grant" error.
    if (hasFetched.current) return;
    hasFetched.current = true;

    const exchangeCodeForToken = async () => {
      try {
        const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8082";
        const realm = "hrm-system";
        const clientId = "hrm-frontend"; // Your new public client
        const redirectUri = `${window.location.origin}/auth/callback`; // Must match exactly

        // Because it's a public client, we post directly to Keycloak's token endpoint
        const tokenEndpoint = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

        // OAuth2 requires form-urlencoded data, not JSON
        const params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("client_id", clientId);
        params.append("code", code);
        params.append("redirect_uri", redirectUri);

        const response = await axios.post(tokenEndpoint, params, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        const token = (response.data as any).access_token;

        if (token) {
          // Save the token to Zustand
          setAuthToken(token);

          const decodedUser = jwtDecode<UserProfile>(token);

          // 4. Save the user profile to Zustand
          login(decodedUser);
          toast.success("Successfully logged in via SSO!");

          // 4. Extract Tenant Subdomain
          let tenantSubdomain = "";
          const orgClaim = decodedUser.organization;

          console.log("Organization: ", orgClaim)

          if (Array.isArray(orgClaim) && orgClaim.length > 0) {
            tenantSubdomain = orgClaim[0];
          } else if (typeof orgClaim === "object" && orgClaim !== null) {
            tenantSubdomain = Object.keys(orgClaim)[0] || "";
          }

          // 5. Hard Redirect to Subdomain
          if (tenantSubdomain) {
            const hostname = window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : '';
            
            // Base domain logic (hrm.local:3000 or hrm.com)
            const baseDomain = hostname.includes("test") ? `hrm.test${port}` : "hrm.com";
            
            window.location.href = `http://${tenantSubdomain}.${baseDomain}/dashboard`;
          } else {
            router.push("/dashboard");
          }
          
          // Redirect to the dashboard
          router.push("/dashboard");
        } else {
          throw new Error("No access token returned from Identity Provider.");
        }
      } catch (err: any) {
        console.error("Token exchange failed:", err.response?.data || err);
        setError("Failed to complete SSO login. Please try again.");
        toast.error("SSO authentication failed.");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    exchangeCodeForToken();
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {error ? (
        <div className="text-center space-y-4 animate-in fade-in">
          <div className="size-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive font-bold text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Authentication Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">Redirecting back to login...</p>
        </div>
      ) : (
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <div className="relative flex items-center justify-center">
            {/* Pulsing background effect */}
            <div className="absolute size-24 border-4 border-primary/20 rounded-full animate-ping" />
            
            {/* Spinning loader */}
            <div className="size-16 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
              <Loader2 className="size-8 text-primary-foreground animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Securing your session...</h1>
            <p className="text-muted-foreground">Please wait while we log you into your workspace.</p>
          </div>
        </div>
      )}
    </div>
  );
}