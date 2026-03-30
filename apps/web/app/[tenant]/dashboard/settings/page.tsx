"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Loader2, CreditCard, Calendar, Clock,
  AlertTriangle, ArrowRight, ShieldCheck, Zap, Sparkles, CheckCircle2,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

import { useGetSubscriptionStatusApiV1BillingSubscriptionGet } from "@repo/orval-config/src/api/billing/billing";
import { AccentBar, SectionCard } from "./components/_shared";

// ── Lazy-load every non-first tab ─────────────────────────────────────────────
const SecurityTab = dynamic(() => import("./components/securityTab"), {
  loading: () => (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-[3px] w-full rounded-t-2xl bg-muted animate-pulse" />
      <div className="flex items-center justify-center gap-3 py-20">
        <Loader2 className="size-6 animate-spin text-chart-2" />
        <p className="text-sm text-muted-foreground">Loading security settings…</p>
      </div>
    </div>
  ),
  ssr: false, // auth state is client-only; skip SSR for this chunk
});

// ─────────────────────────────────────────────────────────────────────────────
function getStatusConfig(status?: string) {
  const s = status?.toLowerCase() ?? "";
  if (s === "active")
    return { dot: "bg-success",          pill: "bg-success-subtle text-success border border-success/30" };
  if (s === "trialing")
    return { dot: "bg-warning",          pill: "bg-warning-subtle text-warning-foreground border border-warning/30" };
  if (["past_due", "unpaid", "canceled"].includes(s))
    return { dot: "bg-destructive",      pill: "bg-destructive/10 text-destructive border border-destructive/20" };
  return   { dot: "bg-muted-foreground", pill: "bg-muted text-muted-foreground border border-border" };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("subscription");

  const { data: subscription, isLoading, isError } =
    useGetSubscriptionStatusApiV1BillingSubscriptionGet();

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

  const isActive   = subscription?.status === "active";
  const isTrialing = subscription?.status === "trialing";
  const statusCfg  = getStatusConfig(subscription?.status);
  const periodEnded = !!subscription?.current_period_end &&
    new Date(subscription.current_period_end) < new Date();

  return (
    <div className="min-h-screen bg-background sm:px-8 px-4">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Workspace
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your plan, billing, and workspace preferences.
          </p>
        </div>

        {/* ── Tab Bar ───────────────────────────────────────────────────── */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted p-1">
          {(["subscription", "security"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "hover:cursor-pointer inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all capitalize",
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/60",
              ].join(" ")}
            >
              {tab === "subscription"
                ? <CreditCard className="size-4" />
                : <ShieldCheck className="size-4" />}
              {tab === "subscription" ? "Subscription" : "Security"}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB: SUBSCRIPTION  (rendered eagerly — first tab)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "subscription" && (
          <SectionCard>
            <AccentBar />

            {/* Header */}
            <div className="border-b border-border px-6 py-5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-2">
                <Zap className="size-3" /> Current Plan
              </div>
              <h2 className="text-base font-semibold text-card-foreground">Subscription Overview</h2>
              <p className="text-sm text-muted-foreground">
                Your active plan, billing cycle, and usage details.
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              {isLoading && (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <Loader2 className="size-7 animate-spin text-chart-2" />
                  <p className="text-sm text-muted-foreground">Fetching your plan details…</p>
                </div>
              )}

              {!isLoading && (isError || !subscription || periodEnded) && (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10">
                    <AlertTriangle className="size-6 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-card-foreground">No Active Subscription</h3>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      We couldn't find an active plan for this workspace. Choose a plan to unlock all features.
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && !isError && subscription && !periodEnded && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
                  {/* Left */}
                  <div className="sm:col-span-3 space-y-4">
                    <div>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Plan</p>
                      <p className="text-4xl font-semibold tracking-tight text-foreground capitalize">
                        {isTrialing ? "Free Trial" : subscription.plan}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusCfg.pill}`}>
                      <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
                      {subscription.status}
                    </span>
                    {isTrialing && subscription.trial_remaining_hours > 0 && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-warning/25 bg-warning-subtle px-4 py-3">
                        <Clock className="size-4 shrink-0 text-warning" />
                        <p className="text-sm font-medium text-warning-foreground">
                          {subscription.trial_remaining_hours} hours left in your trial
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Right */}
                  <div className="sm:col-span-2 rounded-xl border border-border bg-muted/40 p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                        <Calendar className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Billing Period</p>
                        <p className="text-sm font-medium text-card-foreground">{formatDate(subscription.current_period_start)}</p>
                        <p className="text-xs text-muted-foreground">→ {formatDate(subscription.current_period_end)}</p>
                      </div>
                    </div>
                    {subscription.credit_balance > 0 && (
                      <>
                        <div className="h-px bg-border" />
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                            <Sparkles className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Credit Balance</p>
                            <p className="text-sm font-medium text-card-foreground">₹{subscription.credit_balance.toLocaleString()}</p>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="h-px bg-border" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      Renews automatically unless cancelled
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Secured by Stripe
              </div>
              <Button
                onClick={() => (window.location.href = "http://hrm.test:3000/pricing")}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90
                           font-medium text-sm px-5 py-2 rounded-xl shadow-sm transition-all hover:shadow-md hover:cursor-pointer"
              >
                {isActive ? "Change Plan" : "Upgrade Now"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </SectionCard>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: SECURITY  (lazy-loaded on first click)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "security" && <SecurityTab />}

      </div>
    </div>
  );
}