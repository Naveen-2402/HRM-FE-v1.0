"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { Building2, Mail, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { useOnboardTenantTenantsOnboardPost } from "@repo/orval-config/src/api/default/default";
import { emailSchema, tenantNameSchema, validateWith } from "@repo/ui/lib/validators";

export default function TenantSignupPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  
  const onboardMutation = useOnboardTenantTenantsOnboardPost({
    mutation: {
      onSuccess: () => setIsSuccess(true),
    }
  });

  const form = useForm({
    defaultValues: {
      tenant_name: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      await onboardMutation.mutateAsync({ data: value });
    },
  });

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <Card className="border border-border bg-card shadow-2xl text-center py-10 px-6 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            
            <CardContent className="flex flex-col items-center gap-6 p-0">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
                <CheckCircle2 className="size-10 text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold tracking-tight text-card-foreground">Workspace Created!</CardTitle>
                <CardDescription className="text-base text-muted-foreground max-w-sm mx-auto">
                  We've sent an admin setup email to your inbox. Click the link inside to set your password and access your dashboard.
                </CardDescription>
              </div>
              <Link href="/login" className="w-full mt-4">
                <Button size="xl" className="w-full hover:cursor-pointer bg-primary text-primary-foreground">
                  Go to Login <ArrowRight className="m-2 size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      
      {/* Brand Header */}
      <div className="mb-5 text-center flex justify-center items-center gap-2">
        <div className="size-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
          <Sparkles className="size-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AgentsFactory HRM</h1>
      </div>

      <Card className="py-2 w-full max-w-lg border border-border bg-card shadow-xl overflow-hidden">
        <CardHeader className="space-y-3 pb-8 pt-8 px-8 border-b border-border bg-muted/30">
          <CardTitle className="text-3xl font-bold tracking-tight text-card-foreground">
            Create your workspace
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Set up your organization's hiring platform in less than a minute.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 py-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-5"
          >
            {/* Company Name Field */}
            <form.Field
              name="tenant_name"
              validators={{ onChange: ({ value }) => validateWith(tenantNameSchema)(value) }}
              children={(field) => (
                <div className="space-y-2 relative">
                  <Label htmlFor={field.name} className="text-sm font-semibold text-foreground">
                    Company Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 size-5 text-muted-foreground" />
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Acme Corp"
                      className="pl-11 h-12 text-base border-input bg-background text-foreground focus-visible:ring-ring transition-shadow"
                    />
                  </div>
                  {/* Fixed height container to prevent layout shift */}
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
                  {/* Fixed height container to prevent layout shift */}
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

            {/* Backend Error Handling */}
            {onboardMutation.isError && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm font-medium flex items-start gap-3">
                 <div className="font-bold">!</div>
                 <p>{(onboardMutation.error as any)?.response?.data?.detail || "An error occurred during onboarding. Please try again."}</p>
              </div>
            )}

            <Button 
              type="submit" 
              size="lg"
              className="w-full h-12 text-base font-semibold hover:cursor-pointer bg-primary text-primary-foreground mt-0 group"
              disabled={form.state.isSubmitting || onboardMutation.isPending}
            >
              {form.state.isSubmitting || onboardMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Signing up...
                </>
              ) : (
                <>
                  Sign Up
                  <ArrowRight className="ml-2 size-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-border py-3 bg-muted/10">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline hover:cursor-pointer font-semibold">
              Log in instead
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}