"use client";

import React from "react";
import { Loader2, Coins, Layers, ArrowRight, CheckCircle2, Wallet } from "lucide-react";
import { toast } from "react-toastify";

// Imports from your Orval config
import { useListPlansApiV1SuperadminPlansGet } from "@repo/orval-config/src/api/superadmin/superadmin";
import { 
  useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost,
  useGetCreditBalanceApiV1BillingCreditsGet
} from "@repo/orval-config/src/api/billing/billing";

import { Button } from "@repo/ui/components/ui/button";
import { AccentBar, SectionCard } from "@/components/_shared";
import { usePermissions } from "@/hooks/usePermissions";

export default function CreditsTab() {
  const { hasPermission } = usePermissions();

  // ── Data Fetching ──
  const { data: balanceData, isLoading: isLoadingBalance } = useGetCreditBalanceApiV1BillingCreditsGet();
  const { data: plansData, isLoading: isLoadingPlans } = useListPlansApiV1SuperadminPlansGet();
  
  const plans = (plansData as any) || [];
  
  // Safely extract the balance (available = balance - consumed - reserved)
  const currentBalance = balanceData 
    ? (balanceData as any).credit_balance - (balanceData as any).consumed_credits - (balanceData as any).reserved_credits
    : 0;

  // Filter only products marked as "credits" in their metadata
  const credits = plans.filter((p: any) => p.metadata?.type === "credits" || p.type === "credits");

  // Flatten the prices for a clean grid
  const creditPrices = credits.flatMap((plan: any) =>
    (plan.prices || []).map((price: any) => ({
      ...price,
      planName: plan.name,
      productId: plan.product_id,
      metadata: plan.metadata,
    }))
  );

  // ── Checkout Mutation ──
  const checkoutMutation = useCreateCreditCheckoutSessionApiV1BillingCreditsCheckoutPost();

  const handleBuyCredits = async (priceId: string) => {
    try {
      const response = await checkoutMutation.mutateAsync({
        data: { price_id: priceId },
      });
      
      // Redirect to the Stripe Checkout URL returned by your backend
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
    <div className="space-y-6">
      
      {/* ── 1. Current Balance Section ── */}
      <SectionCard>
        <AccentBar />
        <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              <Wallet className="size-3.5" /> Workspace Balance
            </div>
            
            {isLoadingBalance ? (
              <div className="flex items-center gap-3 mt-2 h-[48px]">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Loading balance...</span>
              </div>
            ) : (
              <h2 className="text-5xl font-extrabold text-foreground tracking-tighter text-tighter mt-1 flex items-baseline gap-3">
                {currentBalance.toLocaleString()}
                <span className="text-xl font-medium text-muted-foreground tracking-tight">
                  Credits
                </span>
              </h2>
            )}
          </div>
          <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 hidden sm:block">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Active Tier</span>
          </div>
        </div>
      </SectionCard>

      {/* ── 2. Buy Credits Section ── */}
      <SectionCard>
        <div className="border-b border-border px-6 py-5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-success">
            <Coins className="size-3" /> Top Up
          </div>
          <h2 className="text-base font-semibold text-card-foreground">Buy Credits</h2>
          <p className="text-sm text-muted-foreground">
            Purchase one-time credit bundles to power your workspace usage.
          </p>
        </div>

        <div className="p-6">
          {isLoadingPlans ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <Loader2 className="size-7 animate-spin text-success" />
              <p className="text-sm text-muted-foreground">Loading available credit packages…</p>
            </div>
          ) : creditPrices.length === 0 ? (
            <div className="text-center py-12 border border-border border-dashed rounded-xl bg-muted/20">
              <p className="text-muted-foreground text-sm font-medium">No credit packages are currently available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {creditPrices.map((price: any) => {
                const isProcessing = checkoutMutation.isPending && checkoutMutation.variables?.data?.price_id === price.price_id;

                return (
                  <div 
                    key={price.price_id} 
                    className="flex flex-col p-8 rounded-3xl border border-border/50 bg-card/30 shadow-sm hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shrink-0 transition-transform group-hover:scale-110">
                        <Layers className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xl font-bold text-foreground truncate tracking-tight">
                          {price.metadata?.credits ? `${price.metadata.credits} Credits` : (price.nickname || price.planName)}
                        </p>
                        <p className="text-[13px] text-muted-foreground font-medium uppercase tracking-widest">
                          Bundle
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                          <CheckCircle2 className="size-4 text-primary" /> Instant activation
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                          <CheckCircle2 className="size-4 text-primary" /> No expiration date
                        </div>
                      </div>

                      <div className="border-t border-border/50 pt-6 mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-extrabold text-foreground tracking-tighter">
                            {formatCurrency(price.amount, price.currency)}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            {price.currency} Total
                          </p>
                        </div>
                          {hasPermission("billing:access") ? (
                            <button
                              onClick={() => handleBuyCredits(price.price_id)}
                              disabled={isProcessing}
                              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-xs font-bold hover:cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
                            >
                              {isProcessing ? "Wait..." : "Buy Now"}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic font-medium">Admin only</span>
                          )}
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}