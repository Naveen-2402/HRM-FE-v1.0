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

export default function CreditsTab() {
  // ── Data Fetching ──
  const { data: balanceData, isLoading: isLoadingBalance } = useGetCreditBalanceApiV1BillingCreditsGet();
  const { data: plansData, isLoading: isLoadingPlans } = useListPlansApiV1SuperadminPlansGet();
  
  const plans = (plansData as any) || [];
  
  // Safely extract the balance (fallback to 0 if undefined)
  const currentBalance = (balanceData as any)?.credit_balance ?? (balanceData as any)?.balance ?? 0;

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
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <Wallet className="size-3.5" /> Workspace Balance
            </div>
            
            {isLoadingBalance ? (
              <div className="flex items-center gap-3 mt-2 h-[36px]">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading balance...</span>
              </div>
            ) : (
              <h2 className="text-4xl font-extrabold text-foreground tracking-tight mt-1 flex items-baseline gap-2">
                {currentBalance.toLocaleString()}
                <span className="text-lg font-medium text-muted-foreground tracking-normal">
                  Credits
                </span>
              </h2>
            )}
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
                    className="flex flex-col p-6 rounded-2xl border border-border bg-background shadow-sm hover:border-success/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="size-12 rounded-full bg-success/10 flex items-center justify-center border border-success/20 text-success shrink-0">
                        <Layers className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl font-bold text-foreground truncate tracking-tight">
                          {price.metadata?.credits ? `${price.metadata.credits} Credits` : (price.nickname || price.planName)}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium truncate">
                          One-time purchase
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-4 text-success" /> Added instantly to balance
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-4 text-success" /> Never expires
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 mt-2 flex items-center justify-between">
                        <p className="text-2xl font-extrabold text-foreground tracking-tight">
                          {formatCurrency(price.amount, price.currency)}
                          <span className="text-xs font-medium text-muted-foreground uppercase ml-1 tracking-normal">
                            {price.currency}
                          </span>
                        </p>

                        <Button
                          onClick={() => handleBuyCredits(price.price_id)}
                          disabled={checkoutMutation.isPending}
                          className="bg-success text-success-foreground hover:bg-success/90 hover:cursor-pointer shadow-sm rounded-xl px-4"
                        >
                          {isProcessing ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <>
                              Buy Now <ArrowRight className="size-3.5 ml-1.5" />
                            </>
                          )}
                        </Button>
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