"use client";

import React, { useState } from "react";
import { 
  Plus, Package, Loader2, Layers, 
  CalendarClock, Coins
} from "lucide-react";

import { 
  useListPlansApiV1SuperadminPlansGet,
} from "@repo/orval-config/src/api/superadmin/superadmin";

import { Button } from "@repo/ui/components/ui/button";
import CreateProductModal from "./components/CreateProductModal"

export default function SubscriptionPlansPage() {
  // ── Queries ──
  const { data: plansData, isLoading } = useListPlansApiV1SuperadminPlansGet();
  const plans = (plansData as any) || []; 

  // ── Smart Metadata Filtering & Flattening ──
  const subscriptions = plans.filter((p: any) => p.metadata?.type !== "credits");
  const credits = plans.filter((p: any) => p.metadata?.type === "credits");

  // Flatten prices so we can map them in a single unified grid
  const allSubscriptionPrices = subscriptions.flatMap((plan: any) => 
    (plan.prices || []).map((price: any) => ({ ...price, planName: plan.name, productId: plan.product_id }))
  );

  const allCreditPrices = credits.flatMap((plan: any) => 
    (plan.prices || []).map((price: any) => ({ ...price, planName: plan.name, productId: plan.product_id, metadata: plan.metadata }))
  );

  // ── Modal States ──
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Helper to format currency
  const formatCurrency = (amountInCents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0
    }).format(amountInCents / 100);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Subscription & Billing Plans
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your Stripe recurring products and one-time credit packages.
          </p>
        </div>
        <Button 
          onClick={() => setIsProductModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer shadow-sm"
        >
          <Plus className="size-4 mr-2" /> New Product
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="size-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Loading catalog from Stripe...</p>
        </div>
      ) : (
        <div className="space-y-16">
          
          {/* ════════════════════════════════════════════════════════════════════
              SECTION 1: RECURRING SUBSCRIPTIONS
          ════════════════════════════════════════════════════════════════════ */}
          <section className="space-y-6 border border-border bg-card rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <CalendarClock className="size-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Recurring Subscriptions</h2>
              </div>
            </div>
            
            {allSubscriptionPrices.length === 0 ? (
              <div className="text-center py-12 border border-border border-dashed rounded-xl bg-muted/20">
                <p className="text-muted-foreground text-sm font-medium">No subscription tiers configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allSubscriptionPrices.map((price: any) => (
                  <div key={price.price_id} className="relative flex flex-col p-6 rounded-xl border border-border bg-background shadow-sm hover:shadow-md hover:border-primary/40 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <Package className="size-4" />
                        {price.planName}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-3xl font-extrabold text-foreground tracking-tight">
                        {formatCurrency(price.amount, price.currency)}
                        <span className="text-sm font-medium text-muted-foreground uppercase ml-1 tracking-normal">
                          {price.currency}
                        </span>
                      </p>
                      <p className="text-sm font-medium text-muted-foreground mt-1 capitalize">
                        {price.nickname ? `${price.nickname} • Billed ${price.interval}ly` : `Billed ${price.interval}ly`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ════════════════════════════════════════════════════════════════════
              SECTION 2: CREDIT PACKAGES
          ════════════════════════════════════════════════════════════════════ */}
          <section className="space-y-6 border border-border bg-card rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Coins className="size-6 text-success" />
                <h2 className="text-2xl font-bold text-foreground">Credit Packages</h2>
              </div>
            </div>
            
            {allCreditPrices.length === 0 ? (
              <div className="text-center py-12 border border-border border-dashed rounded-xl bg-muted/20">
                <p className="text-muted-foreground text-sm font-medium">No credit bundles configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allCreditPrices.map((price: any) => (
                  <div key={price.price_id} className="flex flex-col p-5 rounded-xl border border-border bg-background shadow-sm hover:border-success/50 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-success/10 flex items-center justify-center border border-success/20 text-success shrink-0">
                        <Layers className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-foreground truncate">
                          {price.metadata?.credits ? `${price.metadata.credits} Credits` : (price.nickname || price.planName)}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium truncate">
                          {formatCurrency(price.amount, price.currency)} {price.currency.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Create Product Modal ── */}
      {isProductModalOpen && (
        <CreateProductModal setIsProductModalOpen={setIsProductModalOpen}/>
      )}
    </div>
  );
}