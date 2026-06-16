"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Fingerprint, ShieldCheck, UserCog } from "lucide-react";
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

  const getStepIndex = () => {
    if (statusText === "Exchanging Google authorization code...") return 1;
    if (statusText === "Checking profile enrollment status...") return 2;
    return 0;
  };
  const stepIndex = getStepIndex();

  const steps = [
    { title: "Connection Established", description: "Securing candidate session", icon: Fingerprint },
    { title: "Google Authentication", description: "Verifying credentials", icon: ShieldCheck },
    { title: "Profile Verification", description: "Checking enrollment status", icon: UserCog }
  ];

  return (
    <div className="w-full max-w-sm text-center relative z-10 px-4">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-indigo-500/10 blur-[80px] pointer-events-none" />

      {error ? (
        <div className="space-y-4 py-4 relative z-10">
          <div className="size-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20 animate-pulse shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <AlertCircle className="size-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-black text-white">Authentication Failed</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <p className="text-[10px] text-slate-500 font-semibold italic pt-2">
            Redirecting back to candidate login page...
          </p>
        </div>
      ) : (
        <div className="space-y-8 py-4 relative z-10">
          {/* Header Icon */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="size-16 bg-slate-950 border border-indigo-500/30 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-[0_0_40px_rgba(79,70,229,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50" />
                <Fingerprint className="size-7 text-indigo-400 animate-pulse relative z-10" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Authenticating</h2>
              <p className="text-xs text-slate-400 font-medium">Please do not close this window</p>
            </div>
          </div>

          {/* Steps Container */}
          <div className="space-y-4 text-left px-2 sm:px-4">
            {steps.map((step, idx) => {
              const isActive = stepIndex === idx;
              const isPast = stepIndex > idx;
              const Icon = step.icon;

              return (
                <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'opacity-100 scale-105 transform-gpu' : isPast ? 'opacity-70' : 'opacity-30'}`}>
                  <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
                    isActive ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.3)]' :
                    isPast ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    'bg-slate-800/50 border-slate-700/50 text-slate-500'
                  }`}>
                    {isPast ? <CheckCircle2 className="size-5 text-emerald-400" /> : 
                     isActive ? <Loader2 className="size-5 animate-spin text-indigo-400" /> : 
                     <Icon className="size-5" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold transition-colors duration-500 ${isActive ? 'text-indigo-300' : isPast ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {step.title}
                    </h4>
                    <p className={`text-xs transition-colors duration-500 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{step.description}</p>
                  </div>
                </div>
              );
            })}
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
