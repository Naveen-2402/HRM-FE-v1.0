"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Package, DollarSign, Loader2, Tag, Layers, 
  CalendarClock, Coins, CreditCard, ArrowRight
} from "lucide-react";
import { toast } from "react-toastify";

import { 
  useListPlansApiV1SuperadminPlansGet,
  useCreateProductApiV1SuperadminProductsPost,
  useCreatePriceApiV1SuperadminPricesPost,
  getListPlansApiV1SuperadminPlansGetQueryKey
} from "@repo/orval-config/src/api/superadmin/superadmin";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { SectionCard, AccentBar } from "@/components/_shared";

// ─────────────────────────────────────────────────────────────────────────────
type ProductType = "subscription" | "credits";
type IntervalType = "month" | "year";

export default function SubscriptionPlansPage() {
  const queryClient = useQueryClient();

  // Queries
  const { data: plansData, isLoading } = useListPlansApiV1SuperadminPlansGet();
  const plans = (plansData as any) || []; 

  // Split data into categories
  const subscriptions = plans.filter((p: any) => p.type === "subscription");
  const credits = plans.filter((p: any) => p.type === "credits");

  // Mutations
  const createProductMutation = useCreateProductApiV1SuperadminProductsPost();
  const createPriceMutation = useCreatePriceApiV1SuperadminPricesPost();

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [priceModalFor, setPriceModalFor] = useState<{ id: string, name: string, type: string } | null>(null);

  // Form States
  const [productForm, setProductForm] = useState({ name: "", description: "", type: "subscription" as ProductType });
  const [priceForm, setPriceForm] = useState({ amount: "", currency: "inr", interval: "month" as IntervalType, interval_count: 1, credits: "" });

  // ── Handlers ──
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProductMutation.mutateAsync({ data: productForm as any });
      toast.success("Product created successfully in Stripe.");
      setIsProductModalOpen(false);
      setProductForm({ name: "", description: "", type: "subscription" });
      queryClient.invalidateQueries({ queryKey: getListPlansApiV1SuperadminPlansGetQueryKey() });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to create product.");
    }
  };

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalFor) return;

    try {
      const payload: any = {
        product_id: priceModalFor.id,
        amount: Math.round(parseFloat(priceForm.amount) * 100), // Convert to cents
        currency: priceForm.currency,
      };

      if (priceModalFor.type === "subscription") {
        payload.interval = priceForm.interval;
        payload.interval_count = Number(priceForm.interval_count) || 1;
      } else {
        payload.credits = parseInt(priceForm.credits);
      }

      await createPriceMutation.mutateAsync({ data: payload });
      toast.success("Price added successfully.");
      setPriceModalFor(null);
      setPriceForm({ amount: "", currency: "inr", interval: "month", interval_count: 1, credits: "" });
      queryClient.invalidateQueries({ queryKey: getListPlansApiV1SuperadminPlansGetQueryKey() });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to add price.");
    }
  };

  // Helper to format currency
  const formatCurrency = (amountInCents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0
    }).format(amountInCents / 100);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
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
        <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-card">
          <Loader2 className="size-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Loading catalog from Stripe...</p>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* ════════════════════════════════════════════════════════════════════
              SECTION 1: RECURRING SUBSCRIPTIONS
          ════════════════════════════════════════════════════════════════════ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <CalendarClock className="size-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Recurring Plans</h2>
            </div>
            
            {subscriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-border rounded-xl bg-card border-dashed">
                <Package className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm font-medium">No subscription products configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {subscriptions.map((plan: any) => (
                  <SectionCard key={plan.product_id} className="flex flex-col h-full overflow-hidden">
                    <AccentBar />
                    <div className="p-6 border-b border-border bg-muted/10">
                      <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {plan.description || "No description provided."}
                      </p>
                    </div>

                    <div className="p-6 flex-1 bg-card">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                        <Tag className="size-3" /> Pricing Tiers
                      </h4>
                      <div className="space-y-3">
                        {plan.prices?.length > 0 ? (
                          plan.prices.map((price: any) => (
                            <div key={price.price_id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background shadow-sm">
                              <div>
                                <p className="text-lg font-bold text-foreground">
                                  {formatCurrency(price.amount, price.currency)}
                                  <span className="text-xs text-muted-foreground font-normal ml-1 uppercase">
                                    {price.currency}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground font-medium capitalize">
                                  {price.interval_count > 1 ? `Every ${price.interval_count} ${price.interval}s` : `Billed ${price.interval}ly`}
                                </p>
                              </div>
                              <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded border border-border truncate max-w-[100px]" title={price.price_id}>
                                {price.price_id.replace("price_", "")}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 bg-muted/50 rounded-lg border border-border border-dashed">
                            <p className="text-sm text-muted-foreground">No active prices</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border-t border-border bg-muted/10">
                      <Button 
                        variant="outline" 
                        className="w-full bg-background hover:bg-muted text-foreground hover:cursor-pointer border-border shadow-sm"
                        onClick={() => setPriceModalFor({ id: plan.product_id, name: plan.name, type: plan.type })}
                      >
                        <DollarSign className="size-4 mr-2" /> Add Subscription Tier
                      </Button>
                    </div>
                  </SectionCard>
                ))}
              </div>
            )}
          </section>

          {/* ════════════════════════════════════════════════════════════════════
              SECTION 2: CREDIT PACKAGES
          ════════════════════════════════════════════════════════════════════ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg text-success border border-success/20">
                <Coins className="size-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Credit Packages</h2>
            </div>
            
            {credits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-border rounded-xl bg-card border-dashed">
                <Layers className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm font-medium">No credit packages configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {credits.map((plan: any) => (
                  <SectionCard key={plan.product_id} className="flex flex-col sm:flex-row overflow-hidden">
                    
                    {/* Left Info Panel */}
                    <div className="p-6 sm:w-1/3 border-b sm:border-b-0 sm:border-r border-border bg-muted/10 flex flex-col justify-center">
                      <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {plan.description || "One-time purchase credit bundles."}
                      </p>
                      <Button 
                        onClick={() => setPriceModalFor({ id: plan.product_id, name: plan.name, type: plan.type })}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer shadow-sm"
                      >
                        <Plus className="size-4 mr-2" /> Add Credit Bundle
                      </Button>
                    </div>

                    {/* Right Prices Panel */}
                    <div className="p-6 sm:w-2/3 bg-card flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plan.prices?.length > 0 ? (
                          plan.prices.map((price: any) => (
                            <div key={price.price_id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background shadow-sm hover:border-success/30 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-success/10 flex items-center justify-center border border-success/20 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors">
                                  <Layers className="size-5" />
                                </div>
                                <div>
                                  <p className="text-base font-bold text-foreground">
                                    {price.metadata?.credits || price.nickname?.split(" ")[0] || "---"} Credits
                                  </p>
                                  <p className="text-sm text-muted-foreground font-medium">
                                    {formatCurrency(price.amount, price.currency)}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="size-4 text-muted-foreground opacity-50" />
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                            No credit bundles created for this product yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Create Product Modal ── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold text-foreground">Create New Product</h2>
              <p className="text-sm text-muted-foreground mt-1">This creates the base container for your prices.</p>
            </div>
            
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Name</label>
                <Input required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="bg-background border-input focus-visible:ring-ring" placeholder="e.g. Pro Plan or Credit Pack" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                <Input required value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="bg-background border-input focus-visible:ring-ring" placeholder="Customer facing description" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Type</label>
                <select 
                  value={productForm.type} 
                  onChange={e => setProductForm({...productForm, type: e.target.value as ProductType})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:cursor-pointer"
                >
                  <option value="subscription">Recurring Subscription</option>
                  <option value="credits">One-Time Credits</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)} className="w-full hover:cursor-pointer border-border">Cancel</Button>
                <Button type="submit" disabled={createProductMutation.isPending} className="w-full bg-primary text-primary-foreground hover:cursor-pointer">
                  {createProductMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Price Modal ── */}
      {priceModalFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold text-foreground">
                {priceModalFor.type === "subscription" ? "Add Subscription Tier" : "Add Credit Bundle"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Creating a new price for <strong className="text-foreground">{priceModalFor.name}</strong>.</p>
            </div>
            
            <form onSubmit={handleCreatePrice} className="p-6 space-y-5">
              
              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</label>
                  <Input required type="number" step="0.01" min="0" value={priceForm.amount} onChange={e => setPriceForm({...priceForm, amount: e.target.value})} className="bg-background border-input focus-visible:ring-ring" placeholder="99.00" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Currency</label>
                  <select 
                    value={priceForm.currency} 
                    onChange={e => setPriceForm({...priceForm, currency: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:cursor-pointer uppercase"
                  >
                    <option value="inr">INR</option>
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                  </select>
                </div>
              </div>

              {/* Conditional Fields based on Product Type */}
              {priceModalFor.type === "subscription" ? (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interval</label>
                    <select 
                      value={priceForm.interval} 
                      onChange={e => setPriceForm({...priceForm, interval: e.target.value as IntervalType})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:cursor-pointer"
                    >
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interval Count</label>
                    <Input required type="number" min="1" max="12" value={priceForm.interval_count} onChange={e => setPriceForm({...priceForm, interval_count: parseInt(e.target.value)})} className="bg-background border-input focus-visible:ring-ring" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Included Credits</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input required type="number" min="1" value={priceForm.credits} onChange={e => setPriceForm({...priceForm, credits: e.target.value})} className="pl-9 bg-background border-input focus-visible:ring-ring" placeholder="e.g. 500" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                <Button type="button" variant="outline" onClick={() => setPriceModalFor(null)} className="w-full hover:cursor-pointer border-border">Cancel</Button>
                <Button type="submit" disabled={createPriceMutation.isPending} className="w-full bg-primary text-primary-foreground hover:cursor-pointer">
                  {createPriceMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create Price"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}