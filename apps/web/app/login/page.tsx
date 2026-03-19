"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Mail, Lock, Loader2, Briefcase, ArrowRight, Eye, EyeOff } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";

import { useLoginAuthLoginPost } from "@repo/orval-config/src/api/default/default";
import { emailSchema, ssoPasswordSchema, validateWith } from "@repo/ui/lib/validators";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const setToken = useAuthStore((state) => state.setToken);
  
  const loginMutation = useLoginAuthLoginPost();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setGlobalError(null);
      try {
        const response = await loginMutation.mutateAsync({ 
          data: { 
            username: value.email, 
            password: value.password 
          } 
        })

        const token = (response.data as any).access_token;
        setToken(token);
        
        toast.success("Login successfull");
        
        router.push("/dashboard");
      } catch (error: any) {
        setGlobalError(
          error?.response?.data?.detail?.error_description || "Invalid email or password. Please try again."
        );
      }
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      
      {/* Brand Header */}
      <div className="mb-5 text-center flex justify-center items-center gap-2">
        <div className="size-12 rounded-xl bg-primary flex items-center justify-center shadow-lg cursor-pointer" onClick={() => router.push("/")}>
          <Briefcase className="size-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AgentsFactory HRM</h1>
      </div>

      <Card className="py-2 w-full max-w-lg border border-border bg-card shadow-xl overflow-hidden">
        <CardHeader className="space-y-3 pb-8 pt-5 px-8 border-b border-border bg-muted/30">
          <CardTitle className="text-3xl font-bold tracking-tight text-card-foreground">
            Welcome back
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Log in to your account to manage your workspace.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 py-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Backend Error Handling */}
            {globalError && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm font-medium flex items-start gap-3">
                 <div className="font-bold">!</div>
                 <p>{globalError}</p>
              </div>
            )}

            {/* Email Field */}
            <form.Field
              name="email"
              validators={{ onChange: ({ value }) => validateWith(emailSchema)(value) }}
              children={(field) => (
                <div className="space-y-2 relative">
                  <Label htmlFor={field.name} className="text-sm font-semibold text-foreground">
                    Work Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 size-5 text-muted-foreground" />
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="admin@acmecorp.com"
                      className="pl-11 h-12 text-base border-input bg-background text-foreground focus-visible:ring-ring transition-shadow"
                    />
                  </div>
                  <div className="h-5">
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm font-medium text-destructive animate-in slide-in-from-top-1">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            />

            {/* Password Field */}
            <form.Field
              name="password"
              validators={{ onChange: ({ value }) => validateWith(ssoPasswordSchema)(value) }}
              children={(field) => (
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.name} className="text-sm font-semibold text-foreground">
                      Password
                    </Label>
                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline hover:cursor-pointer">
                      Forgot password?
                    </Link>
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
                      className="pl-11 h-12 text-base border-input bg-background text-foreground focus-visible:ring-ring transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  <div className="h-5">
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm font-medium text-destructive animate-in slide-in-from-top-1">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            />

            <Button 
              type="submit" 
              size="lg"
              className="w-full h-12 text-base font-semibold hover:cursor-pointer bg-primary text-primary-foreground mt-0 group"
              disabled={form.state.isSubmitting || loginMutation.isPending}
            >
              {form.state.isSubmitting || loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 size-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-border py-3 bg-muted/10">
          <p className="text-sm text-muted-foreground">
            Don't have a workspace yet?{" "}
            <Link href="/signup" className="text-primary hover:underline hover:cursor-pointer font-semibold">
              Create one now
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}