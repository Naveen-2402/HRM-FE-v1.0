"use client";

import React, { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  UserCheck,
  Loader2,
  CheckCircle2,
  Fingerprint,
  ShieldCheck,
  UserCog
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

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

function CandidateLoginFormContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = params.tenant as string;
  const redirectUrl = searchParams.get("redirect");

  const loginState = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState(0);

  const loginMutation = useCandidateLoginApiV1CandidateAuthLoginPost();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginFields,
    onSubmit: async ({ value }) => {
      try {
        setLoginStep(1);
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

        setLoginStep(2);

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

        setLoginStep(3);
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

  if (loading || googleLoading) {
    const activeIndex = googleLoading ? 0 : Math.max(0, loginStep - 1);

    const steps = [
      { title: googleLoading ? "Google Authentication" : "Verifying Credentials", description: "Authenticating user identity", icon: Fingerprint },
      { title: "Securing Session", description: "Establishing encrypted connection", icon: ShieldCheck },
      { title: "Profile Synchronization", description: "Loading candidate data", icon: UserCog }
    ];

    return (
      <div className="flex flex-col items-center justify-center py-20 w-full max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
        {/* Header Icon */}
        <div className="flex flex-col items-center justify-center space-y-4 mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] rounded-full" />
            <div className="size-20 bg-slate-900 border border-indigo-500/30 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-[0_0_40px_rgba(79,70,229,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50" />
              <Fingerprint className="size-8 text-indigo-400 animate-pulse relative z-10" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Authenticating</h2>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Please Wait</p>
          </div>
        </div>

        {/* Steps Container */}
        <div className="space-y-5 text-left w-full">
          {steps.map((step, idx) => {
            const isActive = activeIndex === idx;
            const isPast = activeIndex > idx;
            const Icon = step.icon;

            return (
              <div key={idx} className={`flex items-center gap-5 transition-all duration-500 ${isActive ? 'opacity-100 scale-105 transform-gpu' : isPast ? 'opacity-70' : 'opacity-30'}`}>
                <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${isActive ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.3)]' :
                    isPast ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                      'bg-slate-800/50 border-slate-700/50 text-slate-500'
                  }`}>
                  {isPast ? <CheckCircle2 className="size-6 text-emerald-400" /> :
                    isActive ? <Loader2 className="size-6 animate-spin text-indigo-400" /> :
                      <Icon className="size-6" />}
                </div>
                <div>
                  <h4 className={`text-base font-bold transition-colors duration-500 ${isActive ? 'text-indigo-300' : isPast ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {step.title}
                  </h4>
                  <p className={`text-xs mt-0.5 transition-colors duration-500 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 mb-2">
            <Sparkles className="size-3.5" /> Welcome Back
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Access your global profile and track job applications across the platform.
          </p>
        </motion.div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <motion.div variants={itemVariants}>
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => validateWith(emailSchema)(value),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="text-xs font-bold text-slate-300 ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-4.5 group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-11 h-12 bg-slate-900/50 border-slate-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder:text-slate-600 transition-all"
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            </form.Field>
          </motion.div>

          <motion.div variants={itemVariants}>
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => validateWith(passwordSchema)(value),
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor={field.name} className="text-xs font-bold text-slate-300">Password</Label>
                    <Link href="#" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 size-4.5 group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="••••••••"
                      className="pl-11 pr-12 h-12 bg-slate-900/50 border-slate-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm placeholder:text-slate-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                    </button>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-[10px] text-red-400 font-bold ml-1">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            </form.Field>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </motion.div>
        </form>

        <motion.div variants={itemVariants} className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative px-4 bg-slate-950 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest">
            Or continue with
          </span>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            type="button"
            variant="outline"
            className="w-full h-12 bg-transparent hover:bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <div className="size-4 border-2 border-slate-400 border-t-slate-200 rounded-full animate-spin" />
            ) : (
              <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#ea4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.728 5.728 0 0 1 8.24 12.79a5.728 5.728 0 0 1 5.751-5.73 5.62 5.62 0 0 1 3.914 1.547l3.078-3.079A9.917 9.917 0 0 0 13.99 2 9.99 9.99 0 0 0 4 12c0 5.523 4.477 10 9.99 10 5.79 0 9.886-4.066 9.886-10 0-.689-.06-1.32-.178-1.715h-11.46z"
                />
              </svg>
            )}
            Sign In with Google
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center pt-4">
          <p className="text-sm text-slate-400 font-medium">
            Don't have an account?{" "}
            <Link
              href={`/${tenant}/candidate/register${redirectUrl ? `?redirect=${redirectUrl}` : ""}`}
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold underline decoration-indigo-400/30 underline-offset-4 hover:decoration-indigo-400"
            >
              Create one free
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function CandidateLoginPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row selection:bg-indigo-500/30">

      {/* Left Panel - Branding & Visuals (Hidden on smaller screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 border-r border-slate-800 items-center justify-center p-12">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />

        {/* Floating elements animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 max-w-lg space-y-8"
        >
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">
            <Building className="size-8 text-indigo-400" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
            Accelerate your career with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{tenant.toUpperCase()}</span>
          </h1>

          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            Join our talent network today. Let our AI-driven platform match your unique skills with the perfect opportunity.
          </p>

          <div className="pt-8 flex items-center gap-4 text-sm font-semibold text-slate-500">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`size-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center z-[${5 - i}]`}>
                  <UserCheck className="size-4 text-slate-400" />
                </div>
              ))}
            </div>
            <p>Trusted by thousands of candidates</p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form Container */}
      <div className="flex-1 flex flex-col relative">

        {/* Mobile Header / Top Navigation */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building className="size-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-300">
              {tenant.toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => router.push(`/${tenant}`)}
            className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors gap-1.5 ml-auto cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Back to job board
          </button>
        </div>

        {/* Form Centering Wrapper */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 mt-12 lg:mt-0">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center gap-6 py-20 w-full animate-in fade-in duration-1000">
              <div className="relative flex items-center justify-center">
                <div className="absolute size-24 border-4 border-indigo-500/10 rounded-full animate-ping" />
                <div className="absolute size-16 border-4 border-indigo-500/20 rounded-full animate-ping" style={{ animationDelay: '150ms' }} />
                <div className="size-12 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.2)] z-10 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent" />
                  <Lock className="size-5 text-indigo-400 animate-pulse relative z-10" />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-extrabold text-white tracking-tight">Initializing Secure Login</h3>
                <p className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Establishing end-to-end encryption...</p>
              </div>
            </div>
          }>
            <CandidateLoginFormContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}