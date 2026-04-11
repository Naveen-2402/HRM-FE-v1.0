"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import {
  Building2, Mail, ArrowRight, CheckCircle2,
  Loader2, Sparkles, AtSign, AlertTriangle,
} from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import { useOnboardTenantTenantsOnboardPost } from "@repo/orval-config/src/api/default/default";
import { emailSchema, tenantNameSchema, validateWith } from "@repo/ui/lib/validators";
import { AccentBar } from "@/components/_shared";

// ─── Reusable field wrapper ───────────────────────────────────────────────────
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
    <div className="space-y-1.5">
      <Label
        htmlFor={field.name}
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          id={field.name}
          name={field.name}
          type={type}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 h-11 border-input bg-background text-foreground focus-visible:ring-ring"
        />
      </div>
      {field.state.meta.errors.length > 0 && (
        <p className="text-xs text-destructive animate-in slide-in-from-top-1">
          {field.state.meta.errors.join(", ")}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TenantSignupPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const onboardMutation = useOnboardTenantTenantsOnboardPost({
    mutation: { onSuccess: () => setIsSuccess(true) },
  });

  const form = useForm({
    defaultValues: { tenant_name: "", email: "", contact_email: "" },
    onSubmit: async ({ value }) => {
      await onboardMutation.mutateAsync({ data: value as any });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">

      {/* Logo + wordmark */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-primary shadow-sm">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          AgentsFactory <span className="text-muted-foreground font-normal">HRM</span>
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-sm overflow-hidden
                      animate-in fade-in slide-in-from-bottom-3 duration-300">
        <AccentBar />

        {/* ── Success state ──────────────────────────────────────────────── */}
        {isSuccess ? (
          <>
            <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
              <div className="flex size-14 items-center justify-center rounded-full border border-success/25 bg-success-subtle">
                <CheckCircle2 className="size-6 text-success" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-card-foreground">Workspace Created!</h2>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  We've sent an admin setup email to your contact address. Click the link inside to
                  set your password and access your dashboard.
                </p>
              </div>
              <Link href="/login?local=true" className="w-full">
                <Button
                  size="lg"
                  className="w-full h-11 font-semibold hover:cursor-pointer bg-primary text-primary-foreground
                             hover:bg-primary/90 rounded-xl inline-flex items-center gap-2"
                >
                  Go to Login <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center border-t border-border bg-muted/30 px-8 py-4">
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-foreground hover:underline hover:cursor-pointer">
                  Log in instead
                </Link>
              </p>
            </div>
          </>
        ) : (
          /* ── Signup form ──────────────────────────────────────────────── */
          <>
            {/* Header */}
            <div className="border-b border-border px-8 py-6 space-y-1">
              <h2 className="text-xl font-semibold text-card-foreground">Create your workspace</h2>
              <p className="text-sm text-muted-foreground">
                Set up your organization's hiring platform in less than a minute.
              </p>
            </div>

            {/* Form */}
            <div className="px-8 py-6">
              <form
                onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
                className="space-y-5"
              >
                <form.Field
                  name="tenant_name"
                  validators={{ onChange: ({ value }) => validateWith(tenantNameSchema)(value) }}
                >
                  {(field) => (
                    <Field
                      label="Company Name"
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
                      label="User Account (Login ID)"
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

                {/* API error */}
                {onboardMutation.isError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
                    <AlertTriangle className="size-4 mt-0.5 shrink-0 text-destructive" />
                    <p className="text-sm text-destructive">
                      {(onboardMutation.error as any)?.response?.data?.detail ||
                        "An error occurred during onboarding. Please try again."}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={form.state.isSubmitting || onboardMutation.isPending}
                  className="w-full h-11 font-semibold hover:cursor-pointer bg-primary text-primary-foreground
                             hover:bg-primary/90 rounded-xl inline-flex items-center gap-2 group mt-1"
                >
                  {form.state.isSubmitting || onboardMutation.isPending ? (
                    <><Loader2 className="size-4 animate-spin" /> Creating Workspace…</>
                  ) : (
                    <>Complete Setup <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </Button>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center border-t border-border bg-muted/30 px-8 py-4">
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-foreground hover:underline hover:cursor-pointer">
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