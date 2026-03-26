"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useForm } from "@tanstack/react-form";
import { toast } from "react-toastify";
import { Mail, Lock, Loader2, Briefcase, Eye, EyeOff, ArrowLeft } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { useAuthStore, UserProfile } from "@/store/useAuthStore";
import { useLoginAuthLoginPost } from "@repo/orval-config/src/api/default/default";
import { useActivateCurrentEmployeeApiV1EmployeesActivatePost } from "@repo/orval-config/src/api/employees/employees";
import { emailSchema, ssoPasswordSchema, validateWith } from "@repo/ui/lib/validators";
import { useTenantRedirect } from "@/hooks/useTenantRedirect";

import { jwtDecode } from "jwt-decode";
import { setAuthToken } from "@repo/utils";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const { redirectToTenantDashboard } = useTenantRedirect();
  
  // Check if the URL has ?local=true
  const isLocalLogin = searchParams.get("local") === "true";

  const [step, setStep] = useState<1 | 2>(1);
  const [isChecking, setIsChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const loginMutation = useLoginAuthLoginPost();
  const activateMutation = useActivateCurrentEmployeeApiV1EmployeesActivatePost();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await loginMutation.mutateAsync({ 
          data: { username: value.email, password: value.password } 
        });

        const token = (response.data as any).access_token;
        
        // 1. Set the cross-subdomain cookie
        setAuthToken(token);
        
        // 2. Fire the activation endpoint silently before decoding the user
        try {
          await activateMutation.mutateAsync();
        } catch (activationError) {
          console.warn("Employee activation skipped or failed (likely already active).");
        }

        // 3. Decode the Keycloak JWT to extract the user's profile and organization
        const decodedUser = jwtDecode<UserProfile>(token);
        
        // 4. Update Zustand state
        login(decodedUser);
        
        toast.success("Login successful");

        redirectToTenantDashboard();

      } catch (error: any) {
        toast.error(
          error?.response?.data?.detail?.error_description || 
          error?.response?.data?.detail || 
          "Invalid email or password."
        );
      }
    },
  });

  const handleCheckDomain = async () => {
    const currentEmail = form.getFieldValue("email");
    if (!currentEmail) return;

    // 2. If local=true, INSTANTLY bypass the SSO check and ask for password
    if (isLocalLogin) {
      setStep(2);
      return;
    }

    setIsChecking(true);

    try {
      const response = await axios.get(`/auth/check-domain?email=${encodeURIComponent(currentEmail)}`);
      
      if (response.data.sso_enabled) {
        const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8082";
        const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
        const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID; 
        const redirectUri = `${window.location.origin}/auth/callback`;
        const idpAlias = response.data.idp_alias;

        const authUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email%20organization&kc_idp_hint=${idpAlias}`;        
        window.location.href = authUrl; 
      } else {
        setStep(2);
      }
    } catch (error) {
      setStep(2); // Fallback to password step if the check fails
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <CardHeader className="space-y-3 pb-8 pt-5 px-8 border-b border-border bg-muted/30 relative">
        {step === 2 && (
          <button 
            onClick={() => { 
              setStep(1); 
              form.setFieldValue("password", ""); 
            }}
            className="absolute left-6 top-6 text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <CardTitle className="text-3xl font-bold tracking-tight text-card-foreground text-center">
          {step === 1 ? (isLocalLogin ? "Admin Login" : "Sign in") : "Enter password"}
        </CardTitle>
        <form.Subscribe
          selector={(state) => state.values.email}
          children={(email) => (
            <CardDescription className="text-base text-muted-foreground text-center">
              {step === 1 ? "Enter your work email to continue" : `Signing in as ${email}`}
            </CardDescription>
          )}
        />
      </CardHeader>
      
      <CardContent className="px-8 py-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (step === 1) {
              handleCheckDomain();
            } else {
              form.handleSubmit();
            }
          }}
          className="space-y-6"
        >
          {/* STEP 1 FORM: Email Only */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-left-4 space-y-6">
              <form.Field
                name="email"
                validators={{ onChange: ({ value }) => validateWith(emailSchema)(value) }}
                children={(field) => (
                  <div className="space-y-2 relative">
                    <Label htmlFor={field.name} className="text-sm font-semibold text-foreground">Work Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 size-5 text-muted-foreground" />
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="admin@acmecorp.com"
                        autoFocus
                        className="pl-11 h-12 text-base border-input bg-background text-foreground focus-visible:ring-ring"
                      />
                    </div>
                    <div className="h-4">
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs font-medium text-destructive">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              />

              <form.Subscribe
                selector={(state) => state.values.email}
                children={(email) => (
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isChecking || !email} 
                    className="w-full h-12 text-base font-semibold hover:cursor-pointer bg-primary text-primary-foreground group"
                  >
                    {isChecking ? <><Loader2 className="mr-2 size-5 animate-spin" /> Checking...</> : "Continue"}
                  </Button>
                )}
              />
            </div>
          )}

          {/* STEP 2 FORM: Password Only */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
              <form.Field
                name="password"
                validators={{ onChange: ({ value }) => validateWith(ssoPasswordSchema)(value) }}
                children={(field) => (
                  <div className="space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={field.name} className="text-sm font-semibold text-foreground">Password</Label>
                      <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline hover:cursor-pointer">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 size-5 text-muted-foreground" />
                      <Input
                        id={field.name}
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="••••••••"
                        autoFocus
                        className="pl-11 h-12 text-base border-input bg-background text-foreground focus-visible:ring-ring"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                    <div className="h-4">
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs font-medium text-destructive">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              />

              <form.Subscribe
                selector={(state) => state.values.password}
                children={(password) => (
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={loginMutation.isPending || !password} 
                    className="w-full h-12 text-base font-semibold hover:cursor-pointer bg-primary text-primary-foreground group"
                  >
                    {loginMutation.isPending ? <><Loader2 className="mr-2 size-5 animate-spin" /> Signing in...</> : "Sign In"}
                  </Button>
                )}
              />
            </div>
          )}
        </form>
      </CardContent>
    </>
  );
}

// 3. The main page component wraps the form in a Suspense boundary
export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="mb-5 text-center flex justify-center items-center gap-2">
        <div 
          className="size-12 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:cursor-pointer" 
          onClick={() => router.push("/")}
        >
          <Briefcase className="size-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AgentsFactory HRM</h1>
      </div>

      <Card className="py-2 w-full max-w-lg border border-border bg-card shadow-xl overflow-hidden transition-all duration-300">
        <Suspense fallback={
          <div className="flex justify-center items-center h-48">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <LoginFormContent />
        </Suspense>
        
        <CardFooter className="flex justify-center border-t border-border py-4 bg-muted/10">
          <p className="text-sm text-muted-foreground">
            Don't have a workspace? <Link href="/signup" className="text-primary hover:underline hover:cursor-pointer font-semibold">Create one</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}