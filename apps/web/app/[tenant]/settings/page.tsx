"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Loader2, CreditCard, Calendar, AlertTriangle, ArrowRight, ShieldCheck,
  CircleDollarSign, Github, ChevronLeft, Mail, Sliders, FileText
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import Link from "next/link";

import { useGetSubscriptionStatusApiV1BillingSubscriptionGet } from "@repo/orval-config/src/api/billing/billing";
import { AccentBar, SectionCard } from "@/components/_shared";
import { usePermissions } from "@/hooks/usePermissions";
import { getRootOrigin } from "@repo/utils/src/domain";

const SecurityTab = dynamic(() => import("./components/securityTab"), {
  loading: () => <TabSkeleton text="Loading security settings…" icon={ShieldCheck} />,
  ssr: false,
});

const EmailTab = dynamic(() => import("./components/emailTab"), {
  loading: () => <TabSkeleton text="Loading email settings…" icon={Mail} />,
  ssr: false,
});

const CreditsTab = dynamic(() => import("./components/creditsTab"), {
  loading: () => <TabSkeleton text="Loading credit packages…" icon={CircleDollarSign} />,
  ssr: false,
});

const GithubTab = dynamic(() => import("./components/githubTab"), {
  loading: () => <TabSkeleton text="Loading GitHub config…" icon={Github} />,
  ssr: false,
});

const WorkflowTab = dynamic(() => import("./components/workflowTab"), {
  loading: () => <TabSkeleton text="Loading workflow settings…" icon={Sliders} />,
  ssr: false,
});

const AiContextTab = dynamic(
  () => import("../dashboard/settings/components/aiContextTab"),
  {
    loading: () => <TabSkeleton text="Loading AI context settings…" icon={FileText} />,
    ssr: false,
  }
);

function TabSkeleton({ text, icon: Icon }: { text: string, icon: any }) {
  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-muted animate-pulse" />
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <Icon className="size-8 text-muted-foreground/30 animate-pulse" />
        <p className="text-sm font-medium text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function getStatusConfig(status?: string) {
  const s = status?.toLowerCase() ?? "";
  if (s === "active")
    return { dot: "bg-success", pill: "bg-success-subtle text-success border border-success/30" };
  if (s === "trialing")
    return { dot: "bg-warning", pill: "bg-warning-subtle text-warning-foreground border border-warning/30" };
  if (["past_due", "unpaid", "canceled"].includes(s))
    return { dot: "bg-destructive", pill: "bg-destructive/10 text-destructive border border-destructive/20" };
  return { dot: "bg-muted-foreground", pill: "bg-muted text-muted-foreground border border-border" };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Subscription");
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const { data: subscription, isLoading, isError } = useGetSubscriptionStatusApiV1BillingSubscriptionGet();

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

  const isActive = subscription?.status === "active";
  const isTrialing = subscription?.status === "trialing";
  const statusCfg = getStatusConfig(subscription?.status);
  const periodEnded = !!subscription?.current_period_end &&
    new Date(subscription.current_period_end) < new Date();

  const allTabs = [
    { id: "Subscription", label: "Subscription", icon: CreditCard, permission: "billing:read" },
    { id: "Credits", label: "Credits", icon: CircleDollarSign, permission: "credits:read" },
    { id: "Security", label: "Security", icon: ShieldCheck, permission: "tenant:access" },
    { id: "Email", label: "Email Config", icon: Mail, permission: "tenant:access" },
    { id: "Workflow", label: "Workflow Rules", icon: Sliders, permission: "approval:configure" },
    { id: "Github", label: "Github Config", icon: Github, permission: "github:manage" },
    { id: "AiContext", label: "AI Context", icon: FileText, permission: "candidate:manage" },
  ] as const;

  const visibleTabs = allTabs.filter(tab => hasPermission(tab.permission));

  if (isLoadingPermissions) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── Crisper Header ── */}
      <div className="mb-6 md:mb-8 space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all w-fit"
        >
          <ChevronLeft className="size-4" />
          Back to Dashboard
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage workspace preferences and billing.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            {visibleTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left whitespace-nowrap ${isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <tab.icon className={`size-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 w-full">
          {activeTab === "Subscription" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionCard>
                <AccentBar />
                <div className="border-b border-border px-6 py-5">
                  <h2 className="text-lg font-bold text-card-foreground">Subscription Overview</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your active plan, billing cycle, and usage details.</p>
                </div>
                <div className="p-6">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-14">
                      <Loader2 className="size-7 animate-spin text-chart-2" />
                      <p className="text-sm text-muted-foreground">Fetching your plan details…</p>
                    </div>
                  ) : (isError || !subscription || periodEnded) ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10">
                        <AlertTriangle className="size-6 text-destructive" />
                      </div>
                      <h3 className="font-semibold text-card-foreground mt-2">No Active Subscription</h3>
                      <p className="max-w-xs text-sm text-muted-foreground">
                        We couldn't find an active plan for this workspace. Choose a plan to unlock all features.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                      <div className="lg:col-span-3 space-y-4">
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Plan</p>
                          <p className="text-4xl font-extrabold tracking-tight text-foreground capitalize">
                            {isTrialing ? "Free Trial" : subscription.plan}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusCfg.pill}`}>
                          <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
                          {subscription.status}
                        </span>
                      </div>
                      <div className="lg:col-span-2 rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                            <Calendar className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Billing Period</p>
                            <p className="text-sm font-bold text-card-foreground">{formatDate(subscription.current_period_start)}</p>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">→ {formatDate(subscription.current_period_end)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ShieldCheck className="size-4" /> Secured by Stripe
                  </div>
                  {hasPermission("billing:access") && (
                    <Button
                      onClick={() => (window.location.href = `${getRootOrigin()}/pricing`)}
                      className="rounded-xl font-bold px-6"
                    >
                      {isActive ? "Change Plan" : "Upgrade Now"} <ArrowRight className="ml-2 size-4" />
                    </Button>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === "Credits" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CreditsTab />
            </div>
          )}
          {activeTab === "Security" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SecurityTab />
            </div>
          )}
          {activeTab === "Email" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <EmailTab />
            </div>
          )}
          {activeTab === "Workflow" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <WorkflowTab />
            </div>
          )}
          {activeTab === "Github" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GithubTab />
            </div>
          )}
          {activeTab === "AiContext" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AiContextTab />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}