"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useForm } from "@tanstack/react-form";
import { toast } from "react-toastify";
import {
  Mail, Lock, Loader2,
  Eye, EyeOff, ArrowLeft, AlertTriangle, ArrowRight, CheckCircle2,
} from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Checkbox } from "@repo/ui/components/ui/checkbox";

import { useAuthStore, UserProfile } from "@/store/useAuthStore";
import { useLoginAuthLoginPost } from "@repo/orval-config/src/api/default/default";
import { useActivateCurrentEmployeeApiV1EmployeesActivatePost } from "@repo/orval-config/src/api/employees/employees";
import { getSubscriptionStatusApiV1BillingSubscriptionGet } from "@repo/orval-config/src/api/billing/billing";
import { useForgotPasswordApiV1AuthForgotPasswordPost } from "@repo/orval-config/src/api/authentication/authentication"; 
import { checkDomainApiV1AuthCheckDomainGet } from "@repo/orval-config/src/api/auth/auth/auth";
import { emailSchema, ssoPasswordSchema, validateWith } from "@repo/ui/lib/validators";
import { useTenantRedirect } from "@/hooks/useTenantRedirect";
import { jwtDecode } from "jwt-decode";
import { setAuthTokens } from "@repo/utils";
import { getRootOrigin } from "@repo/utils/src/domain";

// ─────────────────────────────────────────────────────────────────────────────

function LoginFormContent() {
  const searchParams = useSearchParams();
  const { redirectToTenantDashboard } = useTenantRedirect();
  const isLocalLogin = searchParams.get("local") === "true";

  const [step, setStep]                           = useState<1 | 2 | 3>(1);
  const [isChecking, setIsChecking]               = useState(false);
  const [showPassword, setShowPassword]           = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [actionUrl, setActionUrl]                 = useState<string | null>(null);
  const [isSubscriptionStatusPending, setIsSubscriptionStatusPending] = useState(false);

  const login                  = useAuthStore((s) => s.login);
  const loginMutation          = useLoginAuthLoginPost();
  const activateMutation       = useActivateCurrentEmployeeApiV1EmployeesActivatePost();
  const forgotPasswordMutation = useForgotPasswordApiV1AuthForgotPasswordPost();
  const router                 = useRouter();

  const form = useForm({
    defaultValues: { email: "", password: "", rememberMe: false },
    onSubmit: async ({ value }) => {
      try {
        const response = await loginMutation.mutateAsync({
          data: { email: value.email, password: value.password },
        });

        const { access_token, refresh_token, id_token, session_state } = response.data as any;
        
        setAuthTokens(access_token, refresh_token, id_token, session_state, value.rememberMe);

        const decodedUser = jwtDecode<UserProfile>(access_token);
        const isSuperAdmin = decodedUser.realm_access?.roles?.includes("superadmin");

        if (isSuperAdmin) {
          toast.success("Welcome, Superadmin");
          const origin = getRootOrigin(); 
          window.location.href = `${origin}/superadmin/dashboard`;
          setTimeout(() => login(decodedUser), 500);
          return;
        }

        try { await activateMutation.mutateAsync(); } catch {}
        
        setIsSubscriptionStatusPending(true);
        let billingStatus = "inactive";
        try {
          const subscription = await getSubscriptionStatusApiV1BillingSubscriptionGet();
          billingStatus = subscription.status;
          setIsSubscriptionStatusPending(false);
        } catch (billingError: any) {
          const errorDetail = billingError?.response?.data?.detail;
          if (errorDetail === "No subscription found for this tenant." || billingError?.response?.status === 404) {
            billingStatus = "none";
          } else {
            throw billingError;
          }
        }

        const hasActiveAccess = billingStatus === "active" || billingStatus === "trialing";

        if (!hasActiveAccess) {
          const isAdmin = decodedUser.realm_access?.roles?.includes("tenant-admin");
          if (isAdmin) {
            toast.warning("Subscription required.");
            setSubscriptionError("Your workspace does not have an active subscription. Please select a plan to activate it.");
            setActionUrl(`${getRootOrigin()}/pricing`);
          } else {
            setSubscriptionError("Your organization does not have an active subscription. Please contact your workspace administrator.");
          }
          return;
        }

        login(decodedUser);
        toast.success("Login successful");
        redirectToTenantDashboard();
      } catch (error: any) {
        let errorMessage = "Invalid email or password.";
        const detail = error?.response?.data?.detail;
        if (detail) {
          if (typeof detail === "string") {
            try { errorMessage = JSON.parse(detail).error_description || detail; } catch { errorMessage = detail; }
          } else if (typeof detail === "object") {
            errorMessage = detail.error_description || detail.error || JSON.stringify(detail);
          }
        }
        toast.error(errorMessage);
      }
    },
  });

  const handleCheckDomain = async () => {
    const email = form.getFieldValue("email");
    if (!email) return;
    if (isLocalLogin) { setStep(2); return; }
    setIsChecking(true);
    try {
      const response = await checkDomainApiV1AuthCheckDomainGet({ email }) as any;
      if (response.sso_enabled) {
        const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8082";
        const realm       = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
        const clientId    = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "hrm-frontend";
        const redirectUri = `${window.location.origin}/auth/callback`;
        const idpAlias    = response.idp_alias;
        window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email%20organization&kc_idp_hint=${idpAlias}`;
      } else {
        setStep(2);
      }
    } catch (error) {
      console.error("Check domain failed:", error);
      setStep(2);
    } finally {
      setIsChecking(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getFieldValue("email");
    if (!email) return;
    
    try {
      await forgotPasswordMutation.mutateAsync({
        data: { email }
      });
      setStep(3);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to send reset link. Please try again.");
    }
  };

  if (subscriptionError) {
    return (
      <div className="px-10 py-16 flex flex-col items-center text-center gap-6">
        <div className="flex size-20 items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/10 shadow-[0_0_30px_-5px_rgba(var(--destructive),0.2)]">
          <AlertTriangle className="size-10 text-destructive" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {actionUrl ? "Subscription Required" : "Access Denied"}
          </h2>
          <p className="text-base text-muted-foreground max-w-sm leading-relaxed">
            {subscriptionError}
          </p>
        </div>
        <Button
          onClick={() => actionUrl ? window.location.href = actionUrl : router.push("/login")}
          className="w-full mt-4 h-14 font-semibold hover:cursor-pointer bg-primary text-primary-foreground
                     hover:bg-primary/90 rounded-full inline-flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)] transition-all hover:scale-[1.02]"
          size="lg"
        >
          {actionUrl ? "View Pricing Plans" : "Back to Login"}
          <ArrowRight className="size-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative border-b border-border/30 px-10 py-8 text-center space-y-2">
        {step !== 1 && (
          <button
            onClick={() => { setStep(1); form.setFieldValue("password", ""); }}
            className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center justify-center
                       size-10 rounded-2xl border border-border/40 bg-background/30 backdrop-blur-md text-muted-foreground
                       hover:text-foreground hover:bg-background/50 hover:border-border/60 transition-all hover:cursor-pointer shadow-sm"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          {step === 1 ? (isLocalLogin ? "Admin Login" : "Welcome back") 
           : step === 2 ? "Enter your password" 
           : "Check your inbox"}
        </h2>
        
        <form.Subscribe selector={(s) => s.values.email}>
          {(email) => (
            <p className="text-base text-muted-foreground">
              {step === 1 ? "Enter your work email to continue"
               : step === 2 ? <span>Signing in as <span className="font-semibold text-foreground/90">{email}</span></span>
               : "Password reset link sent"}
            </p>
          )}
        </form.Subscribe>
      </div>

      <div className="px-10 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (step === 1) handleCheckDomain();
            else if (step === 2) form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Step 1 — Email */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
              <form.Field
                name="email"
                validators={{ onChange: ({ value }) => validateWith(emailSchema)(value) }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Work Email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none" />
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="admin@acmecorp.com"
                        autoFocus
                        className="pl-12 h-14 rounded-2xl border-border/40 bg-background/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all hover:bg-background/50 shadow-inner text-base"
                      />
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs font-medium text-destructive/90 ml-1 mt-1.5 animate-in slide-in-from-top-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(s) => s.values.email}>
                {(email) => (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isChecking || !email}
                    className="w-full h-14 text-base font-semibold hover:cursor-pointer bg-primary text-primary-foreground
                               hover:bg-primary/90 rounded-full inline-flex items-center justify-center gap-2 group transition-all shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.6)] hover:scale-[1.01]"
                  >
                    {isChecking
                      ? <><Loader2 className="size-5 animate-spin" /> Checking…</>
                      : <>Continue <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" /></>}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          )}

          {/* Step 2 — Password */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <form.Field
                name="password"
                validators={{ onChange: ({ value }) => validateWith(ssoPasswordSchema)(value) }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor={field.name} className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Password
                      </Label>
                      
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={forgotPasswordMutation.isPending}
                        className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors hover:cursor-pointer disabled:opacity-50"
                      >
                        {forgotPasswordMutation.isPending ? "Sending..." : "Forgot password?"}
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none" />
                      <Input
                        id={field.name}
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="••••••••"
                        autoFocus
                        className="pl-12 pr-12 h-14 rounded-2xl border-border/40 bg-background/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all hover:bg-background/50 shadow-inner text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors hover:cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs font-medium text-destructive/90 ml-1 mt-1.5 animate-in slide-in-from-top-1">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="rememberMe">
                {(field) => (
                  <div className="flex items-center space-x-3 pt-2 ml-1">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      className="hover:cursor-pointer size-5 rounded-md border-border/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor={field.name}
                      className="text-sm font-medium leading-none text-muted-foreground hover:cursor-pointer select-none hover:text-foreground transition-colors"
                    >
                      Remember me for 14 days
                    </label>
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(s) => s.values.password}>
                {(password) => (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loginMutation.isPending || activateMutation.isPending || isSubscriptionStatusPending || !password}
                    className="w-full h-14 text-base font-semibold hover:cursor-pointer bg-primary text-primary-foreground
                               hover:bg-primary/90 rounded-full inline-flex items-center justify-center gap-2 group transition-all shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.6)] hover:scale-[1.01]"
                  >
                    {loginMutation.isPending || activateMutation.isPending || isSubscriptionStatusPending
                      ? <><Loader2 className="size-5 animate-spin" /> Signing in…</>
                      : <>Sign In <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" /></>}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          )}

          {/* Step 3 — Forgot Password Success */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center text-center space-y-6 py-1">
              <div className="flex size-20 items-center justify-center rounded-3xl border border-success/30 bg-success-subtle shadow-[0_0_30px_-5px_rgba(var(--success),0.2)]">
                <CheckCircle2 className="size-10 text-success" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Check your email</h2>
                <p className="text-base text-muted-foreground max-w-[520px] leading-relaxed mx-auto">
                  An email has been sent to your registered email address with instructions to reset your password.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => { setStep(1); form.setFieldValue("password", ""); }}
                className="w-full mt-6 h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full hover:cursor-pointer shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)] transition-all duration-300 ease-out hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.6)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Back to Login
              </Button>
            </div>
          )}

        </form>
      </div>
    </>
  );
}

import { Logo } from "../../components/logo";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden z-0">
      
      {/* ── Ambient Background Orbs ── */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-secondary/20 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Logo + Wordmark */}
      <Link href="/" className="mb-10 flex items-center gap-3 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="size-12 flex items-center justify-center bg-card/20 backdrop-blur-md border border-border/30 rounded-2xl shadow-sm">
          <Logo className="size-8" />
        </div>
        <span className="text-2xl font-bold tracking-wide text-foreground">
          AgentsFactory <span className="text-muted-foreground font-medium">HRM</span>
        </span>
      </Link>

      {/* Glassmorphic Card */}
      <div className="w-full max-w-xl rounded-[2.5rem] border border-border/30 bg-background/20 backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden
                      animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150 fill-mode-both">
        
        {/* Subtle glass reflection edge */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>

        <div className="flex items-center justify-center gap-2 border-t border-border/30 bg-muted/10 backdrop-blur-md px-10 py-5">
          <p className="text-sm text-muted-foreground">
            Don't have a workspace?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline hover:cursor-pointer transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}