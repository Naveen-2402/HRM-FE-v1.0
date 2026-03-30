"use client";

import { useState } from "react";
import {
  Loader2, CreditCard, Calendar, Clock,
  AlertTriangle, ArrowRight, ShieldCheck, Zap,
  Sparkles, CheckCircle2,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { useGetSubscriptionStatusApiV1BillingSubscriptionGet } from "@repo/orval-config/src/api/billing/billing";

// ── Tiny helper: status pill config ──────────────────────────────────────────
function getStatusConfig(status?: string) {
  const s = status?.toLowerCase() ?? "";
  if (s === "active")
    return {
      dot: "bg-success",
      pill: "bg-success-subtle text-success border border-success/30",
    };
  if (s === "trialing")
    return {
      dot: "bg-warning",
      pill: "bg-warning-subtle text-warning-foreground border border-warning/30",
    };
  if (["past_due", "unpaid", "canceled"].includes(s))
    return {
      dot: "bg-destructive",
      pill: "bg-destructive/10 text-destructive border border-destructive/20",
    };
  return {
    dot: "bg-muted-foreground",
    pill: "bg-muted text-muted-foreground border border-border",
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("subscription");

  const { data: subscription, isLoading, isError } =
    useGetSubscriptionStatusApiV1BillingSubscriptionGet();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handlePricingRedirect = () => {
    window.location.href = `http://${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}:3000/pricing`;
  };

  const isActive   = subscription?.status === "active";
  const isTrialing = subscription?.status === "trialing";
  const statusCfg  = getStatusConfig(subscription?.status);

  return (
    <div className="min-h-screen bg-background sm:px-8 px-4">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Workspace
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your plan, billing, and workspace preferences.
          </p>
        </div>

        {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted p-1">
          <button
            onClick={() => setActiveTab("subscription")}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === "subscription"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/60",
            ].join(" ")}
          >
            <CreditCard className="size-4" />
            Subscription
          </button>

          <button
            disabled
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground opacity-40 cursor-not-allowed"
          >
            <ShieldCheck className="size-4" />
            Security
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
              soon
            </span>
          </button>
        </div>

        {/* ── Subscription Card ────────────────────────────────────────────── */}
        {activeTab === "subscription" && (
          <div
            className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden
                       animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            {/* Accent bar using chart colors */}
            <div
              className="h-[3px] w-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--chart-3), var(--chart-2), var(--chart-1))",
              }}
            />

            {/* Card Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-chart-2">
                  <Zap className="size-3" />
                  Current Plan
                </div>
                <h2 className="text-base font-semibold text-card-foreground">
                  Subscription Overview
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your active plan, billing cycle, and usage details.
                </p>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* ── Loading ── */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center gap-3 py-14">
                  <Loader2 className="size-7 animate-spin text-chart-2" />
                  <p className="text-sm text-muted-foreground">
                    Fetching your plan details…
                  </p>
                </div>
              )}

              {/* ── Error / No Subscription ── */}
              {!isLoading && (isError || !subscription ||
                (!!subscription.current_period_end &&
                  new Date(subscription.current_period_end) < new Date())) && (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10">
                    <AlertTriangle className="size-6 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-card-foreground">
                      No Active Subscription
                    </h3>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      We couldn't find an active plan for this workspace. Choose
                      a plan to unlock all features.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Subscription Data ── */}
              {!isLoading && !isError && subscription &&
                new Date(subscription.current_period_end) >= new Date() && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">

                  {/* Left — plan identity (3 cols) */}
                  <div className="sm:col-span-3 space-y-4">
                    <div>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        Plan
                      </p>
                      <p className="text-4xl font-semibold tracking-tight text-foreground capitalize">
                        {isTrialing ? "Free Trial" : subscription.plan}
                      </p>
                    </div>

                    {/* Status pill */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusCfg.pill}`}
                      >
                        <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
                        {subscription.status}
                      </span>
                    </div>

                    {/* Trial countdown */}
                    {isTrialing && subscription.trial_remaining_hours > 0 && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-warning/25 bg-warning-subtle px-4 py-3">
                        <Clock className="size-4 shrink-0 text-warning" />
                        <p className="text-sm font-medium text-warning-foreground">
                          {subscription.trial_remaining_hours} hours left in
                          your trial
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right — metadata (2 cols) */}
                  <div className="sm:col-span-2 rounded-xl border border-border bg-muted/40 p-4 space-y-4">

                    {/* Billing period */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                        <Calendar className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                          Billing Period
                        </p>
                        <p className="text-sm font-medium text-card-foreground">
                          {formatDate(subscription.current_period_start)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          → {formatDate(subscription.current_period_end)}
                        </p>
                      </div>
                    </div>

                    {/* Credit balance */}
                    {subscription.credit_balance > 0 && (
                      <>
                        <div className="h-px bg-border" />
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                            <Sparkles className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                              Credit Balance
                            </p>
                            <p className="text-sm font-medium text-card-foreground">
                              ₹{subscription.credit_balance.toLocaleString()}
                            </p>
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

            {/* Card Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Secured by Stripe
              </div>

              <Button
                onClick={handlePricingRedirect}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground
                           hover:bg-primary/90 font-medium text-sm px-5 py-2 rounded-xl
                           shadow-sm transition-all hover:shadow-md hover:cursor-pointer"
              >
                {isActive ? "Change Plan" : "Upgrade Now"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}