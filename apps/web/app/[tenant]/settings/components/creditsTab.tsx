"use client";

import React from "react";
import { Loader2, Coins, ArrowUpRight, Sparkles, CreditCard, Activity, Wallet } from "lucide-react";
import { toast } from "react-toastify";

// Imports from your Orval config
import { useListPlansApiV1SuperadminPlansGet } from "@repo/orval-config/src/api/superadmin/superadmin";
import {
  useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost,
  useGetCreditBalanceApiV1BillingCreditsGet
} from "@repo/orval-config/src/api/billing/billing";

import { Button } from "@repo/ui/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { CreditHistoryTable } from "./CreditHistoryTable";

export default function CreditsTab() {
  const { hasPermission } = usePermissions();
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  // ── Data Fetching ──
  const { data: balanceData, isLoading: isLoadingBalance } = useGetCreditBalanceApiV1BillingCreditsGet();
  const { data: plansData, isLoading: isLoadingPlans } = useListPlansApiV1SuperadminPlansGet();

  const plans = (plansData as any) || [];

  // Safely extract the balance
  const currentBalance = balanceData
    ? (balanceData as any).credit_balance - (balanceData as any).consumed_credits - (balanceData as any).reserved_credits
    : 0;

  // Filter only products marked as "credits" in their metadata
  const credits = plans.filter((p: any) => p.metadata?.type === "credits" || p.type === "credits");

  // Flatten the prices and extract API-driven metadata/features
  const creditPrices = credits.flatMap((plan: any) => {
    let apiFeatures: string[] = [];
    if (Array.isArray(plan.features)) {
      apiFeatures = plan.features;
    } else if (plan.metadata?.features) {
      try {
        apiFeatures = typeof plan.metadata.features === "string"
          ? JSON.parse(plan.metadata.features)
          : plan.metadata.features;
      } catch (e) {
        console.error("Failed to parse plan features", e);
      }
    }

    return (plan.prices || []).map((price: any) => ({
      ...price,
      planName: plan.name,
      planDescription: plan.description,
      productId: plan.product_id,
      metadata: plan.metadata,
      features: apiFeatures,
      isHighlighted: plan.metadata?.is_popular === "true" || plan.metadata?.is_popular === true
    }));
  });

  // Sort by price amount safely
  creditPrices.sort((a: any, b: any) => a.amount - b.amount);

  // ── Checkout Mutation ──
  const checkoutMutation = useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost();

  const handleBuyCredits = async (priceId: string) => {
    try {
      const response = await checkoutMutation.mutateAsync({
        data: { price_id: priceId },
      });

      if (response && response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        toast.error("Failed to generate checkout link.");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to initiate checkout.");
    }
  };

  const formatCurrency = (amountInCents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amountInCents / 100);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-10">

      {/* ── Top Row: Header (Left) + Balance (Right) ── */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 mt-2">
        {/* Left: Titles */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-success mb-2">
            <Coins className="size-3.5" /> Top Up Workspace
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Buy Credit Bundles</h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Purchase one-time credit bundles to instantly power up your workspace operations.
          </p>
        </div>

        {/* Right: Balance Widget pinned strictly to the top right */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4 p-5 pr-8 rounded-2xl border border-border/60 bg-card shadow-sm shrink-0">
            <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                Available Balance
              </p>
              {isLoadingBalance ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground mt-1" />
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight leading-none">
                    {currentBalance.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">Credits</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Plan Status */}
          {(balanceData as any)?.active_plan_name && (
            <div className="text-xs text-muted-foreground pr-2">
              Current base tier: <span className="text-foreground font-semibold">{(balanceData as any).active_plan_name}</span>
            </div>
          )}
        </div>
      </div>

      {hasPermission("billing:access") && (
        <section className="mt-2 mb-8">
          <CreditHistoryTable />
        </section>
      )}
      {/* ── 2. Top-Up List View ── */}
      <section className="space-y-6 mt-4">

        {isLoadingPlans ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : creditPrices.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/50 rounded-2xl">
            <p className="text-muted-foreground text-sm">No packages available at this time.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {creditPrices.map((price: any) => {
              const isProcessing = checkoutMutation.isPending && checkoutMutation.variables?.data?.price_id === price.price_id;
              const isHighlighted = price.isHighlighted;

              return (
                <div
                  key={price.price_id}
                  className={`group relative flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 rounded-2xl border transition-all duration-200 ${isHighlighted
                    ? "bg-primary/[0.03] border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.05)]"
                    : "bg-card/30 border-border/40 hover:bg-card/60 hover:border-border/80"
                    }`}
                >
                  {/* Left Column: Icon & Title */}
                  <div className="flex items-center gap-5 md:w-1/3">
                    <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${isHighlighted ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-foreground"
                      }`}>
                      {isHighlighted ? <Sparkles className="size-5" /> : <CreditCard className="size-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-foreground tracking-tight">
                          {price.metadata?.credits ? `${Number(price.metadata.credits).toLocaleString()} Credits` : (price.nickname || price.planName)}
                        </h4>
                        {isHighlighted && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                            Popular
                          </span>
                        )}
                      </div>
                      {price.planDescription && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {price.planDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: API Features as Inline Pills */}
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {price.features && price.features.length > 0 ? (
                      price.features.map((feature: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-muted/40 border border-border/30 text-xs font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {feature}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">Standard tier benefits</span>
                    )}
                  </div>

                  {/* Right Column: Price & Action */}
                  <div className="flex items-center gap-6 md:justify-end md:w-[250px]">
                    <div className="text-right">
                      <div className="text-2xl font-black text-foreground tracking-tighter">
                        {formatCurrency(price.amount, price.currency)}
                      </div>
                    </div>

                    {hasPermission("billing:access") ? (
                      <Button
                        onClick={() => handleBuyCredits(price.price_id)}
                        disabled={isProcessing}
                        variant={isHighlighted ? "default" : "secondary"}
                        className={`shrink-0 rounded-full font-semibold transition-all ${isHighlighted ? "shadow-md hover:shadow-lg" : ""
                          }`}
                      >
                        {isProcessing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>Buy <ArrowUpRight className="ml-1.5 size-4 opacity-70" /></>
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic font-medium px-4">Admin only</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}