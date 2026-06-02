"use client";

import React, { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Building,
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  UserCheck
} from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { validateWith } from "@repo/ui/lib/validators";
import { 
  useCandidateLoginApiV1CandidateAuthLoginPost,
  candidateGoogleLoginUrlApiV1CandidateAuthGoogleLoginUrlGet
} from "@repo/orval-config/src/api/auth/candidate-auth/candidate-auth";
import { getCandidateMeApiV1CandidatesMeGet } from "@repo/orval-config/src/api/resume_parsing/candidates/candidates";
import { getTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet } from "@repo/orval-config/src/api/tenant/tenants/tenants";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { useAuthStore, UserProfile } from "@/store/useAuthStore";
import { setAuthTokens } from "@repo/utils";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

// Define Zod schemas
const emailSchema = z.string().min(1, "Email is required").email("Invalid email address");
const passwordSchema = z.string().min(1, "Password is required");

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

type LoginFields = z.infer<typeof loginSchema>;

function CandidateLoginFormContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = params.tenant as string;
  const redirectUrl = searchParams.get("redirect");

  const loginState = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useCandidateLoginApiV1CandidateAuthLoginPost();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginFields,
    onSubmit: async ({ value }) => {
      try {
        const response = (await loginMutation.mutateAsync({
          data: {
            email: value.email,
            password: value.password,
          }
        })) as any;

        const data = response.data as any;
        const { access_token, refresh_token, id_token, session_state } = data;

        // Save global cross-domain cookies
        setAuthTokens(access_token, refresh_token, id_token, session_state, true);

        // Decode token and save inside Zustand
        const decodedUser = jwtDecode<UserProfile>(access_token);
        loginState(decodedUser);

        toast.success("Welcome back!");

        // Resolve tenant subdomain to details to get the UUID
        let tenantId = "";
        try {
          const tenantRes = (await getTenantBySubdomainApiV1TenantsBySubdomainSubdomainGet(tenant)) as any;
          const tenantDetails = tenantRes.data || tenantRes;
          tenantId = tenantDetails?.id || "";
        } catch (tenantErr) {
          console.error("Failed to resolve tenant subdomain:", tenantErr);
        }

        // Check if candidate profile already exists using generated direct request
        try {
          await getCandidateMeApiV1CandidatesMeGet({
            headers: {
              "X-Tenant-Id": tenantId,
              "Authorization": `Bearer ${access_token}`
            }
          });
        } catch (err: any) {
          if (err?.response?.status === 404 || err?.response?.data?.detail === "Profile not found") {
            // No profile -> redirect to profile setup
            router.push(`/${tenant}/candidate/profile${redirectUrl ? `?redirect=${redirectUrl}` : ""}`);
            return;
          }
        }

        // If redirect param exists, go there. Otherwise, go to dashboard
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          router.push(`/${tenant}/candidate/dashboard`);
        }
      } catch (err: any) {
        console.error("Candidate login error:", err);
        const msg = err?.response?.data?.detail || "Invalid credentials. Please try again.";
        toast.error(msg);
      }
    },
  });

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const response = (await candidateGoogleLoginUrlApiV1CandidateAuthGoogleLoginUrlGet({
        redirect_uri: `${window.location.origin}/candidate/callback`
      })) as any;

      const data = response.data || response;
      const loginUrl = data.login_url;
      
      if (loginUrl) {
        window.location.href = loginUrl;
      } else {
        throw new Error("Google Redirect URL was not returned by API Gateway.");
      }
    } catch (err: any) {
      console.error("Google Login initialization failed:", err);
      toast.error("Google Sign-In is currently offline.");
      setGoogleLoading(false);
    }
  };

  const loading = loginMutation.isPending;

  return (
    <div className="w-full max-w-md p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 backdrop-blur-2xl space-y-8 relative">
      
      {/* Decorative top accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white">Candidate Sign In</h2>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Access your global profile and track job applications across the HRM platform.
        </p>
      </div>

      {/* Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }} 
        className="space-y-5"
      >
        <form.Field 
          name="email"
          validators={{
            onChange: ({ value }) => validateWith(emailSchema)(value),
          }}
        >
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                <Input 
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
                />
              </div>
              {field.state.meta.errors.length > 0 && (
                <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field 
          name="password"
          validators={{
            onChange: ({ value }) => validateWith(passwordSchema)(value),
          }}
        >
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name} className="text-xs font-bold text-slate-400">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
                <Input 
                  id={field.name}
                  name={field.name}
                  type={showPassword ? "text" : "password"}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-slate-950/80 border-slate-800 focus:border-indigo-500 rounded-xl text-sm placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {field.state.meta.errors.length > 0 && (
                <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
              )}
            </div>
          )}
        </form.Field>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800/80" />
        </div>
        <span className="relative px-3 bg-[#0d1527] text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
          Or continue with
        </span>
      </div>

      {/* Google Login Action Button */}
      <Button
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
        type="button"
        className="w-full h-11 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-355 hover:text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 mb-2 hover:cursor-pointer"
      >
        {googleLoading ? (
          <div className="size-4 border-2 border-slate-400 border-t-slate-200 rounded-full animate-spin" />
        ) : (
          <svg className="size-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#ea4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.728 5.728 0 0 1 8.24 12.79a5.728 5.728 0 0 1 5.751-5.73 5.62 5.62 0 0 1 3.914 1.547l3.078-3.079A9.917 9.917 0 0 0 13.99 2 9.99 9.99 0 0 0 4 12c0 5.523 4.477 10 9.99 10 5.79 0 9.886-4.066 9.886-10 0-.689-.06-1.32-.178-1.715h-11.46z"
            />
          </svg>
        )}
        Sign In with Google
      </Button>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 font-semibold space-y-3 pt-4 border-t border-slate-800/80">
        <p>
          Don't have an account?{" "}
          <Link 
            href={`/${tenant}/candidate/register${redirectUrl ? `?redirect=${redirectUrl}` : ""}`}
            className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold"
          >
            Create one free
          </Link>
        </p>
        <button 
          onClick={() => router.push(`/${tenant}`)}
          className="inline-flex items-center text-slate-500 hover:text-slate-400 font-bold gap-1 mt-2 hover:cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          Back to job board
        </button>
      </div>

    </div>
  );
}

export default function CandidateLoginPage() {
  const params = useParams();
  const tenant = params.tenant as string;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Decorative ambient background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating brand link */}
      <div className="absolute top-8 left-8 flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <Building className="size-4 text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight text-slate-300">
          {tenant.toUpperCase()} Portal
        </span>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-semibold">Preparing authentication panel...</p>
        </div>
      }>
        <CandidateLoginFormContent />
      </Suspense>

    </div>
  );
}
