"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { setAuthTokens } from "@repo/utils";
import { useAuthStore, UserProfile } from "@/store/useAuthStore";
import { candidateGoogleCallbackApiV1CandidateAuthGoogleCallbackPost } from "@repo/orval-config/src/api/auth/candidate-auth/candidate-auth";
import { getCandidateMeApiV1CandidatesMeGet } from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
import { getTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { toast } from "react-toastify";

function CandidateCallbackContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = params.tenant as string;
  const login = useAuthStore((state) => state.login);

  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Securing your candidate session...");
  const hasExecuted = useRef(false);

  useEffect(() => {
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    const code = searchParams.get("code");

    if (!code) {
      setError("No authorization code found from Google.");
      setTimeout(() => router.push(`/${tenant}/candidate/login`), 3000);
      return;
    }

    // Clear code from the URL path for cleaner appearance
    window.history.replaceState({}, document.title, window.location.pathname);

    const exchangeGoogleCode = async () => {
      try {
        setStatusText("Exchanging Google authorization code...");
        
        const response = (await candidateGoogleCallbackApiV1CandidateAuthGoogleCallbackPost({
          code,
          redirect_uri: `${window.location.origin}/candidate/callback`
        })) as any;

        const data = response.data || response;
        const { access_token, refresh_token, id_token, session_state } = data;

        if (!access_token || !refresh_token) {
          throw new Error("Invalid tokens received from Identity Provider.");
        }

        // Save global cross-domain cookies specifically flagged as candidate
        setAuthTokens(access_token, refresh_token, id_token, session_state, true);

        // Decode token and set Zustand state
        const decodedUser = jwtDecode<UserProfile>(access_token);
        login(decodedUser);

        setStatusText("Checking profile enrollment status...");

        // Resolve tenant subdomain to details to get the UUID
        let tenantId = "";
        try {
          const tenantRes = (await getTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(tenant)) as any;
          const tenantDetails = tenantRes.data || tenantRes;
          tenantId = tenantDetails?.id || "";
        } catch (tenantErr) {
          console.error("Failed to resolve tenant subdomain:", tenantErr);
        }

        // Fetch candidate profile to check if it already exists in the database
        try {
          await getCandidateMeApiV1CandidatesMeGet({
            headers: {
              "X-Tenant-Id": tenantId,
              "Authorization": `Bearer ${access_token}`
            }
          });
          
          toast.success("Welcome back!");
          router.push(`/${tenant}/candidate/dashboard`);
        } catch (profileErr: any) {
          if (profileErr?.response?.status === 404) {
            // Setup profile wizard is required for new candidates
            toast.info("Successfully authenticated! Let's setup your candidate profile.");
            router.push(`/${tenant}/candidate/profile`);
          } else {
            // Profile failed to load for another reason, fallback to dashboard
            router.push(`/${tenant}/candidate/dashboard`);
          }
        }

      } catch (err: any) {
        console.error("Google SSO login failed:", err);
        setError(err?.response?.data?.detail || err.message || "Failed to log in with Google.");
        setTimeout(() => router.push(`/${tenant}/candidate/login`), 4000);
      }
    };

    exchangeGoogleCode();
  }, [searchParams, router, login, tenant]);

  return (
    <div className="w-full max-w-md p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 backdrop-blur-2xl text-center space-y-6 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

      {error ? (
        <div className="space-y-4">
          <div className="size-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20 animate-pulse">
            <AlertCircle className="size-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-black text-white">Authentication Failed</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <p className="text-[10px] text-slate-500 font-semibold italic pt-2">
            Redirecting back to candidate login page...
          </p>
        </div>
      ) : (
        <div className="space-y-6 py-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute size-20 border-4 border-indigo-500/20 rounded-full animate-ping" />
            <div className="size-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 z-10">
              <Loader2 className="size-6 text-white animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-white">{statusText}</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Please keep this window open while we secure your account details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidateCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative selection:bg-indigo-500/30 overflow-hidden">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <Suspense fallback={
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-xs font-semibold">Completing connection...</p>
        </div>
      }>
        <CandidateCallbackContent />
      </Suspense>
    </div>
  );
}
