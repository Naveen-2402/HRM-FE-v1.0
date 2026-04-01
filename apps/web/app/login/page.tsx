"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useForm } from "@tanstack/react-form";
import { toast } from "react-toastify";
import {
  Mail, Lock, Loader2, Briefcase,
  Eye, EyeOff, ArrowLeft, AlertTriangle, ArrowRight,
} from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import { useAuthStore, UserProfile } from "@/store/useAuthStore";
import { useLoginAuthLoginPost } from "@repo/orval-config/src/api/default/default";
import { useActivateCurrentEmployeeApiV1EmployeesActivatePost } from "@repo/orval-config/src/api/employees/employees";
import { getSubscriptionStatusApiV1BillingSubscriptionGet } from "@repo/orval-config/src/api/billing/billing";
import { emailSchema, ssoPasswordSchema, validateWith } from "@repo/ui/lib/validators";
import { useTenantRedirect } from "@/hooks/useTenantRedirect";
import { jwtDecode } from "jwt-decode";
import { setAuthToken } from "@repo/utils";

import { AccentBar } from "@/components/_shared";

// ─────────────────────────────────────────────────────────────────────────────

function LoginFormContent() {
  const searchParams = useSearchParams();
  const { redirectToTenantDashboard } = useTenantRedirect();
  const isLocalLogin = searchParams.get("local") === "true";

  const [step, setStep]                       = useState<1 | 2>(1);
  const [isChecking, setIsChecking]           = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [actionUrl, setActionUrl]             = useState<string | null>(null);

  const login          = useAuthStore((s) => s.login);
  const loginMutation  = useLoginAuthLoginPost();
  const activateMutation = useActivateCurrentEmployeeApiV1EmployeesActivatePost();
  const router         = useRouter();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      try {
        const response = await loginMutation.mutateAsync({
          data: { username: value.email, password: value.password },
        });

        const token = (response.data as any).access_token;
        setAuthToken(token);

        const decodedUser = jwtDecode<UserProfile>(token);
        const isSuperAdmin = decodedUser.realm_access?.roles?.includes("superadmin");

        if (isSuperAdmin) {
          toast.success("Welcome, Superadmin");
          const baseDomain = window.location.hostname.includes(`${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}`)
            ? `${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}:3000`
            : `${process.env.NEXT_PUBLIC_HOSTED_DOMAIN}`;
          window.location.href = `http://${baseDomain}/superadmin/dashboard`;
          setTimeout(() => login(decodedUser), 500);
          return;
        }

        try { await activateMutation.mutateAsync(); } catch {}

        let billingStatus = "inactive";
        try {
          const subscription = await getSubscriptionStatusApiV1BillingSubscriptionGet();
          billingStatus = subscription.status;
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
            setActionUrl(`http://${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}:3000/pricing`);
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
      const response = await axios.get(`/auth/check-domain?email=${encodeURIComponent(email)}`);
      if (response.data.sso_enabled) {
        const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8082";
        const realm       = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
        const clientId    = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/callback`;
        const idpAlias    = response.data.idp_alias;
        window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email%20organization&kc_idp_hint=${idpAlias}`;
      } else {
        setStep(2);
      }
    } catch {
      setStep(2);
    } finally {
      setIsChecking(false);
    }
  };

  // ── Subscription error state ───────────────────────────────────────────────
  if (subscriptionError) {
    return (
      <>
        <AccentBar />
        <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
          <div className="flex size-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-card-foreground">
              {actionUrl ? "Subscription Required" : "Access Denied"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {subscriptionError}
            </p>
          </div>
          <Button
            onClick={() => actionUrl ? window.location.href = actionUrl : router.push("/login")}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90
                       font-medium px-6 py-2 rounded-xl hover:cursor-pointer w-full"
            size="lg"
          >
            {actionUrl ? "View Pricing Plans" : "Back to Login"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </>
    );
  }

  // ── Normal login form ──────────────────────────────────────────────────────
  return (
    <>
      <AccentBar />

      {/* Header */}
      <div className="relative border-b border-border px-8 py-6 text-center space-y-1">
        {step === 2 && (
          <button
            onClick={() => { setStep(1); form.setFieldValue("password", ""); }}
            className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center
                       size-8 rounded-lg border border-border bg-background text-muted-foreground
                       hover:text-foreground hover:bg-muted transition-all hover:cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
        <h2 className="text-xl font-semibold text-card-foreground">
          {step === 1 ? (isLocalLogin ? "Admin Login" : "Welcome back") : "Enter your password"}
        </h2>
        <form.Subscribe selector={(s) => s.values.email}>
          {(email) => (
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? "Enter your work email to continue"
                : <span>Signing in as <span className="font-medium text-foreground">{email}</span></span>}
            </p>
          )}
        </form.Subscribe>
      </div>

      {/* Form body */}
      <div className="px-8 py-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            step === 1 ? handleCheckDomain() : form.handleSubmit();
          }}
          className="space-y-5"
        >
          {/* Step 1 — Email */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-200 space-y-5">
              <form.Field
                name="email"
                validators={{ onChange: ({ value }) => validateWith(emailSchema)(value) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Work Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="admin@acmecorp.com"
                        autoFocus
                        className="pl-10 h-11 border-input bg-background text-foreground focus-visible:ring-ring"
                      />
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>
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
                    className="w-full h-11 font-semibold hover:cursor-pointer bg-primary text-primary-foreground
                               hover:bg-primary/90 rounded-xl inline-flex items-center gap-2"
                  >
                    {isChecking
                      ? <><Loader2 className="size-4 animate-spin" /> Checking…</>
                      : <>Continue <ArrowRight className="size-4" /></>}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          )}

          {/* Step 2 — Password */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-5">
              <form.Field
                name="password"
                validators={{ onChange: ({ value }) => validateWith(ssoPasswordSchema)(value) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={field.name} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id={field.name}
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="••••••••"
                        autoFocus
                        className="pl-10 pr-10 h-11 border-input bg-background text-foreground focus-visible:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(s) => s.values.password}>
                {(password) => (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loginMutation.isPending || !password}
                    className="w-full h-11 font-semibold hover:cursor-pointer bg-primary text-primary-foreground
                               hover:bg-primary/90 rounded-xl inline-flex items-center gap-2"
                  >
                    {loginMutation.isPending
                      ? <><Loader2 className="size-4 animate-spin" /> Signing in…</>
                      : <>Sign In <ArrowRight className="size-4" /></>}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">

      {/* Logo + wordmark */}
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex size-10 items-center justify-center rounded-xl border border-border
                     bg-primary shadow-sm transition-all hover:opacity-90 hover:cursor-pointer"
        >
          <Briefcase className="size-5 text-primary-foreground" />
        </button>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          AgentsFactory <span className="text-muted-foreground font-normal">HRM</span>
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-sm overflow-hidden
                      animate-in fade-in slide-in-from-bottom-3 duration-300">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 border-t border-border bg-muted/30 px-8 py-4">
          <p className="text-xs text-muted-foreground">
            Don't have a workspace?{" "}
            <Link
              href="/signup"
              className="font-semibold text-foreground hover:underline hover:cursor-pointer"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}