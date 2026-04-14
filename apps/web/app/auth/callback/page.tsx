"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2, AlertTriangle } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { setAuthTokens } from "@repo/utils";
import { useAuthStore, UserProfile } from "@/store/useAuthStore";
import { getSubscriptionStatusApiV1BillingSubscriptionGet } from "@repo/orval-config/src/api/billing/billing";
import { useActivateCurrentEmployeeApiV1EmployeesActivatePost } from "@repo/orval-config/src/api/employees/employees";
import { Button } from "@repo/ui/components/ui/button";
import { useTenantRedirect } from "@/hooks/useTenantRedirect";
import { getRootOrigin } from "@repo/utils/src/domain";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const { redirectToTenantDashboard } = useTenantRedirect();
  const activateMutation = useActivateCurrentEmployeeApiV1EmployeesActivatePost();

  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Securing your session...");
  const [actionUrl, setActionUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const code = searchParams.get("code");

    if (!code) {
      setError("No authorization code found in the URL.");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    window.history.replaceState({}, document.title, window.location.pathname);

    const exchangeCodeForToken = async () => {
      try {
        const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8082";
        const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
        const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "hrm-frontend"; 
        const redirectUri = `${window.location.origin}/auth/callback`; 

        const tokenEndpoint = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

        const params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("client_id", clientId);
        params.append("code", code);
        params.append("redirect_uri", redirectUri);

        const response = await axios.post(tokenEndpoint, params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        const {
          access_token,
          refresh_token,
          id_token,
          session_state
        } = response.data as any;
        
        if (!access_token || !refresh_token || !id_token) {
          throw new Error("Tokens returned from Identity Provider.");
        }
        
        setAuthTokens(access_token, refresh_token, id_token, session_state);
        
        const decodedUser = jwtDecode<UserProfile>(access_token);
        login(decodedUser);

        try {
          await activateMutation.mutateAsync();
        } catch (activationError) {
          console.warn("Employee activation skipped or failed (likely already active).");
        }
        
        let tenantSubdomain = "";
        const orgClaim = decodedUser.organization;
        if (Array.isArray(orgClaim) && orgClaim.length > 0) {
          tenantSubdomain = orgClaim[0];
        }

        if (!tenantSubdomain) {
          throw new Error("No workspace assigned to this user.");
        }

        setStatusText("Verifying workspace subscription...");
        
        let billingStatus = "inactive"; 

        try {
          const subscription = await getSubscriptionStatusApiV1BillingSubscriptionGet();
          billingStatus = subscription.status;
        } catch (billingError: any) {
          const errorDetail = billingError?.response?.data?.detail;
          
          if (errorDetail === "No subscription found for this tenant." || billingError?.response?.status === 404) {
            console.warn("New workspace detected: No subscription on file.");
            billingStatus = "none"; 
          } else {
            throw billingError; 
          }
        }

        const hasActiveAccess = billingStatus === "active" || billingStatus === "trialing";

        if (hasActiveAccess) {
          toast.success("Successfully logged in via SSO!");
          redirectToTenantDashboard();
          return;
        }

        const isAdmin = decodedUser.realm_access?.roles?.includes("tenant-admin");

        if (isAdmin) {
          toast.warning("Subscription required.");
          setError("Your workspace does not have an active subscription. Please select a plan to activate it.");
          setActionUrl(`${getRootOrigin()}/pricing`);
          return;
        } else {
          setError("Your organization does not have an active subscription. Please contact your workspace administrator to unlock access.");
          useAuthStore.getState().logout(); 
          setCountdown(10);
          return;
        }

      } catch (err: any) {
        console.error("Token exchange or validation failed:", err.response?.data || err);
        setError(err.message || "Failed to complete SSO login. Please try again.");
        setTimeout(() => router.push("/login"), 4000);
      }
    };

    exchangeCodeForToken();
  }, [searchParams, router, login]);

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      router.push("/login");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {error ? (
        <div className="text-center space-y-4 animate-in fade-in max-w-md bg-card p-8 rounded-xl border border-border shadow-lg">
          <div className="size-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {actionUrl ? (
              <AlertTriangle className="size-8 text-destructive" />
            ) : (
              <span className="text-destructive font-bold text-2xl">!</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-card-foreground">
            {actionUrl ? "Subscription Required" : "Access Denied"}
          </h1>
          <p className="text-muted-foreground">{error}</p>
          
          {actionUrl ? (
            <div className="pt-4">
              <Button 
                onClick={() => window.location.href = actionUrl}
                className="w-full p-2 text-primary-foreground bg-primary hover:cursor-pointer"
                size="lg"
              >
                View Pricing Plans
              </Button>
            </div>
          ) : (
            <>
              {error.includes("expired") || error.includes("does not have an active") ? (
                 <p className="text-sm text-muted-foreground mt-4 font-semibold">
                   You have been securely signed out. Redirecting to login in {countdown}s...
                 </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-4">Redirecting back to login in...</p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <div className="relative flex items-center justify-center">
            <div className="absolute size-24 border-4 border-primary/20 rounded-full animate-ping" />
            <div className="size-16 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
              <Loader2 className="size-8 text-primary-foreground animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{statusText}</h1>
            <p className="text-muted-foreground">Please wait while we prepare your workspace.</p>
          </div>
        </div>
      )}
    </div>
  );
}