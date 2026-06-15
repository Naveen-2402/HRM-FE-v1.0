"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import {
  Building2, Mail, ArrowRight, CheckCircle2,
  Loader2, AtSign, AlertTriangle,
} from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Checkbox } from "@repo/ui/components/ui/checkbox";

import { useOnboardTenantTenantsOnboardPost } from "@repo/orval-config/src/api/default/default";
import { emailSchema, tenantNameSchema, validateWith } from "@repo/ui/lib/validators";

import { Logo } from "../../components/logo";
import { useWarmup } from "@/hooks/useWarmup";

// ─── Reusable Glassmorphic Field Wrapper ───────────────────────────────────────
function Field({
  label,
  icon: Icon,
  placeholder,
  field,
  type = "text",
}: {
  label: string;
  icon: React.ElementType;
  placeholder: string;
  field: any;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={field.name}
        className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
      >
        {label}
      </Label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors pointer-events-none" />
        <Input
          id={field.name}
          name={field.name}
          type={type}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          className="pl-11 h-12 rounded-2xl border-border/40 bg-background/30 backdrop-blur-md text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all hover:bg-background/50 shadow-inner"
        />
      </div>
      {field.state.meta.errors.length > 0 && (
        <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1 ml-1">
          {field.state.meta.errors.join(", ")}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TenantSignupPage() {
  useWarmup();
  const [isSuccess, setIsSuccess] = useState(false);

  const onboardMutation = useOnboardTenantTenantsOnboardPost({
    mutation: { onSuccess: () => setIsSuccess(true) },
  });

  const form = useForm({
    defaultValues: { tenant_name: "", email: "", contact_email: "", enable_strict_workflows: false },
    onSubmit: async ({ value }) => {
      await onboardMutation.mutateAsync({ data: value as any });
    },
  });

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

        {/* ── Success state ──────────────────────────────────────────────── */}
        {isSuccess ? (
          <>
            <div className="px-10 py-16 flex flex-col items-center text-center gap-6">
              <div className="flex size-20 items-center justify-center rounded-3xl border border-success/30 bg-success-subtle shadow-[0_0_30px_-5px_rgba(var(--success),0.2)]">
                <CheckCircle2 className="size-10 text-success" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Workspace Created!</h2>
                <p className="text-base text-muted-foreground max-w-sm leading-relaxed">
                  We've sent an admin setup email to your contact address. Click the link inside to
                  set your password and access your dashboard.
                </p>
              </div>
              <Link href="/login?local=true" className="w-full mt-4">
                <Button
                  size="lg"
                  className="w-full h-14 font-semibold hover:cursor-pointer bg-primary text-primary-foreground
                             hover:bg-primary/90 rounded-full inline-flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)] transition-all hover:scale-[1.02]"
                >
                  Go to Login <ArrowRight className="size-5" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center border-t border-border/30 bg-muted/10 backdrop-blur-md px-8 py-5">
              <p className="text-sm text-muted-foreground">
                Need to access a different workspace?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline hover:cursor-pointer transition-colors">
                  Log in here
                </Link>
              </p>
            </div>
          </>
        ) : (
          /* ── Signup form ──────────────────────────────────────────────── */
          <>
            {/* Header */}
            <div className="border-b border-border/30 px-10 py-8 space-y-2 relative">
              <div className="absolute left-0 bottom-0 w-1/3 h-[1px] bg-gradient-to-r from-primary/40 to-transparent" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Provision your workspace</h2>
              <p className="text-base text-muted-foreground">
                Set up your organization's isolated environment in seconds.
              </p>
            </div>

            {/* Form */}
            <div className="px-10 py-8">
              <form
                onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
                className="space-y-6"
              >
                <form.Field
                  name="tenant_name"
                  validators={{ onChange: ({ value }) => validateWith(tenantNameSchema)(value) }}
                >
                  {(field) => (
                    <Field
                      label="Organization Name"
                      icon={Building2}
                      placeholder="Acme Corp"
                      field={field}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="email"
                  validators={{ onChange: ({ value }) => validateWith(emailSchema)(value) }}
                >
                  {(field) => (
                    <Field
                      label="Admin Account (Login ID)"
                      icon={AtSign}
                      placeholder="admin@acmecorp.com"
                      field={field}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="contact_email"
                  validators={{ onChange: ({ value }) => validateWith(emailSchema)(value) }}
                >
                  {(field) => (
                    <Field
                      label="Contact Email (For notifications)"
                      icon={Mail}
                      placeholder="personal.email@gmail.com"
                      field={field}
                    />
                  )}
                </form.Field>

                <form.Field name="enable_strict_workflows">
                  {(field) => (
                    <div className="flex items-start space-x-3 pt-2 ml-1 p-4 rounded-2xl border border-border/20 bg-background/20 backdrop-blur-md shadow-sm">
                      <Checkbox
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                        className="hover:cursor-pointer size-5 mt-0.5 rounded-md border-border/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                      />
                      <div className="grid gap-1.5 leading-none select-none">
                        <label
                          htmlFor={field.name}
                          className="text-sm font-semibold text-foreground hover:cursor-pointer hover:text-primary transition-colors"
                        >
                          Enable strict HR workflows
                        </label>
                        <p className="text-xs text-muted-foreground leading-normal">
                          Requires hiring manager approvals for offers and job requisitions. If unchecked, default actions bypass approval workflows.
                        </p>
                      </div>
                    </div>
                  )}
                </form.Field>

                {/* API error */}
                {onboardMutation.isError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 backdrop-blur-sm px-5 py-4">
                    <AlertTriangle className="size-5 mt-0.5 shrink-0 text-destructive" />
                    <p className="text-sm font-medium text-destructive/90 leading-relaxed">
                      {(onboardMutation.error as any)?.response?.data?.detail ||
                        "An error occurred during provisioning. Please try again."}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={form.state.isSubmitting || onboardMutation.isPending}
                    className="w-full h-14 text-base font-semibold hover:cursor-pointer bg-primary text-primary-foreground
                               hover:bg-primary/90 rounded-full inline-flex items-center justify-center gap-2 group transition-all shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.6)] hover:scale-[1.01]"
                  >
                    {form.state.isSubmitting || onboardMutation.isPending ? (
                      <><Loader2 className="size-5 animate-spin" /> Provisioning Schema…</>
                    ) : (
                      <>Deploy Workspace <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center border-t border-border/30 bg-muted/10 backdrop-blur-md px-10 py-5">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-foreground hover:text-primary transition-colors hover:cursor-pointer">
                  Log in instead
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}