"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Package, Loader2, Layers, 
  CalendarClock, Coins, ArrowRight, DollarSign
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
  const [priceForm, setPriceForm] = useState({ amount: "", currency: "inr", interval: "month" as IntervalType, credits: "", nickname: "" });

  // ── Handlers ──
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        type: productForm.type,
        metadata: {} 
      };

      await createProductMutation.mutateAsync({ data: payload as any });
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
        amount: Math.round(parseFloat(priceForm.amount)), 
        currency: priceForm.currency,
        type: priceModalFor.type, 
      };

      if (priceForm.nickname) payload.nickname = priceForm.nickname;

      if (priceModalFor.type === "subscription") {
        payload.interval = priceForm.interval;
      } else {
        payload.credits = parseInt(priceForm.credits, 10);
      }

      await createPriceMutation.mutateAsync({ data: payload });
      toast.success("Price added successfully.");
      setPriceModalFor(null);
      setPriceForm({ amount: "", currency: "inr", interval: "month", credits: "", nickname: "" });
      queryClient.invalidateQueries({ queryKey: getListPlansApiV1SuperadminPlansGetQueryKey() });
    } catch (error: any) {
      toast.error(error?.response?.data?.errors[0]?.msg || error?.response?.data?.detail || "Failed to add price.");
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
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b border-border pb-2">
              <CalendarClock className="size-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Recurring Subscriptions</h2>
            </div>
            
            {subscriptions.length === 0 ? (
              <div className="text-center py-12 border border-border border-dashed rounded-xl bg-muted/20">
                <p className="text-muted-foreground text-sm font-medium">No subscription products configured.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {subscriptions.map((plan: any) => (
                  <div key={plan.product_id} className="space-y-4">
                    
                    {/* Product Header (Clean, no card) */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="size-4 text-muted-foreground" />
                          <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-2xl">
                          {plan.description || "No description provided."}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-background hover:bg-muted text-foreground border-border shadow-sm hover:cursor-pointer shrink-0"
                        onClick={() => setPriceModalFor({ id: plan.product_id, name: plan.name, type: plan.type })}
                      >
                        <Plus className="size-4 mr-2" /> Add Tier
                      </Button>
                    </div>

                    {/* Price Cards Grid */}
                    {plan.prices?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {plan.prices.map((price: any) => (
                          <div key={price.price_id} className="relative flex flex-col p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all group">
                            
                            {/* Top row: ID badge */}
                            <div className="flex justify-end mb-2">
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">
                                {price.price_id.replace("price_", "")}
                              </span>
                            </div>
                            
                            {/* Center: Amount */}
                            <div className="my-2">
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
                    ) : (
                      <div className="text-sm text-muted-foreground italic py-2 bg-muted/20 px-4 rounded-lg border border-border border-dashed inline-block">
                        No pricing tiers added yet.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ════════════════════════════════════════════════════════════════════
              SECTION 2: CREDIT PACKAGES
          ════════════════════════════════════════════════════════════════════ */}
          <section className="space-y-8 pt-6">
            <div className="flex items-center gap-3 border-b border-border pb-2">
              <Coins className="size-6 text-success" />
              <h2 className="text-2xl font-bold text-foreground">Credit Packages</h2>
            </div>
            
            {credits.length === 0 ? (
              <div className="text-center py-12 border border-border border-dashed rounded-xl bg-muted/20">
                <p className="text-muted-foreground text-sm font-medium">No credit packages configured.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {credits.map((plan: any) => (
                  <div key={plan.product_id} className="space-y-4">
                    
                    {/* Product Header (Clean, no card) */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Layers className="size-4 text-success" />
                          <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-2xl">
                          {plan.description || "One-time purchase credit bundles."}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-background hover:bg-success/10 text-success border-success/30 shadow-sm hover:cursor-pointer shrink-0"
                        onClick={() => setPriceModalFor({ id: plan.product_id, name: plan.name, type: plan.type })}
                      >
                        <Plus className="size-4 mr-2" /> Add Bundle
                      </Button>
                    </div>

                    {/* Price Cards Grid */}
                    {plan.prices?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {plan.prices.map((price: any) => (
                          <div key={price.price_id} className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-success/50 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="size-12 rounded-full bg-success/10 flex items-center justify-center border border-success/20 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors shrink-0">
                                <Layers className="size-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-bold text-foreground truncate">
                                  {`${price.metadata?.credits} Credits` || price.nickname}
                                </p>
                                <p className="text-sm text-muted-foreground font-medium truncate">
                                  {formatCurrency(price.amount, price.currency)} {price.currency.toUpperCase()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic py-2 bg-muted/20 px-4 rounded-lg border border-border border-dashed inline-block">
                        No credit bundles added yet.
                      </div>
                    )}
                  </div>
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

              <div className="flex flex-wrap gap-3 pt-4 border-t border-border mt-6">
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
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Nickname</label>
                <Input value={priceForm.nickname} onChange={e => setPriceForm({...priceForm, nickname: e.target.value})} className="bg-background border-input focus-visible:ring-ring" placeholder="e.g. 500 Credits Promo" />
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input required type="number" step="0.01" min="0" value={priceForm.amount} onChange={e => setPriceForm({...priceForm, amount: e.target.value})} className="pl-9 bg-background border-input focus-visible:ring-ring" placeholder="99.00" />
                  </div>
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
                <div className="space-y-2 animate-in fade-in duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing Interval</label>
                  <select 
                    value={priceForm.interval} 
                    onChange={e => setPriceForm({...priceForm, interval: e.target.value as IntervalType})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:cursor-pointer"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Annually</option>
                  </select>
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

              <div className="flex flex-wrap gap-3 pt-4 border-t border-border mt-6">
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