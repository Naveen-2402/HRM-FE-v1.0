"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Package, Loader2, Layers, 
  CalendarClock, Coins, DollarSign
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
import { Dropdown } from "@/components/_shared/Dropdown";

// ─────────────────────────────────────────────────────────────────────────────
type ProductType = "subscription" | "credits";
type IntervalType = "month" | "year";

export default function SubscriptionPlansPage() {
  const queryClient = useQueryClient();

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

  // ── Mutations ──
  const createProductMutation = useCreateProductApiV1SuperadminProductsPost();
  const createPriceMutation = useCreatePriceApiV1SuperadminPricesPost();

  // ── Modal States ──
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [priceModalType, setPriceModalType] = useState<ProductType | null>(null);

  // ── Form States ──
  const [productForm, setProductForm] = useState({ name: "", description: "", type: "subscription" as ProductType, credits: "" });
  const [priceForm, setPriceForm] = useState({ product_id: "", amount: "", currency: "inr", interval: "month" as IntervalType, nickname: "" });

  // ── Dropdown Options ──
  const productTypeOptions = [
    { label: "Recurring Subscription", value: "subscription" },
    { label: "One-Time Credits", value: "credits" },
  ];

  const currencyOptions = [
    { label: "INR", value: "inr" },
    { label: "USD", value: "usd" },
    { label: "EUR", value: "eur" },
  ];

  const intervalOptions = [
    { label: "Monthly", value: "month" },
    { label: "Annually", value: "year" },
  ];

  // Dynamically generate the product selection options for the Price modal
  const parentProductOptions = priceModalType === "subscription" 
    ? subscriptions.map((p: any) => ({ label: p.name, value: p.product_id }))
    : credits.map((p: any) => ({ label: p.name, value: p.product_id }));

  // ── Handlers ──
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const metadataPayload: any = {};
      if (productForm.type === "credits") {
        metadataPayload.type = "credits";
        metadataPayload.credits = productForm.credits.toString();
      } else {
        metadataPayload.type = "subscription";
      }

      const payload = {
        name: productForm.name,
        description: productForm.description,
        type: productForm.type,
        metadata: metadataPayload 
      };

      await createProductMutation.mutateAsync({ data: payload as any });
      toast.success("Product created successfully in Stripe.");
      setIsProductModalOpen(false);
      setProductForm({ name: "", description: "", type: "subscription", credits: "" });
      queryClient.invalidateQueries({ queryKey: getListPlansApiV1SuperadminPlansGetQueryKey() });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to create product.");
    }
  };

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalType || !priceForm.product_id) {
      toast.error("Please select a parent product.");
      return;
    }

    try {
      const payload: any = {
        product_id: priceForm.product_id,
        amount: Math.round(parseFloat(priceForm.amount)), 
        currency: priceForm.currency,
        type: priceModalType, 
      };

      if (priceForm.nickname) payload.nickname = priceForm.nickname;

      if (priceModalType === "subscription") {
        payload.interval = priceForm.interval;
      }

      await createPriceMutation.mutateAsync({ data: payload });
      toast.success("Price added successfully.");
      setPriceModalType(null);
      setPriceForm({ product_id: "", amount: "", currency: "inr", interval: "month", nickname: "" });
      queryClient.invalidateQueries({ queryKey: getListPlansApiV1SuperadminPlansGetQueryKey() });
    } catch (error: any) {
      toast.error(error?.response?.data?.errors?.[0]?.msg || error?.response?.data?.detail || "Failed to add price.");
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
          <Plus className="size-4 mr-2" /> New Product Container
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
              <Button 
                variant="outline" 
                size="sm"
                className="bg-background hover:bg-muted text-foreground border-border shadow-sm hover:cursor-pointer shrink-0"
                onClick={() => setPriceModalType("subscription")}
              >
                <Plus className="size-4 mr-2" /> Add Subscription Tier
              </Button>
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
              <Button 
                variant="outline" 
                size="sm"
                className="bg-background hover:bg-success/10 text-success border-success/30 shadow-sm hover:cursor-pointer shrink-0"
                onClick={() => setPriceModalType("credits")}
              >
                <Plus className="size-4 mr-2" /> Add Credit Bundle
              </Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold text-foreground">Create New Product Container</h2>
              <p className="text-sm text-muted-foreground mt-1">Products group your pricing tiers together in Stripe.</p>
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
                <Dropdown 
                  label="Product Type"
                  options={productTypeOptions}
                  value={productForm.type}
                  onChange={(val) => setProductForm({ ...productForm, type: val as ProductType })}
                />
              </div>

              {productForm.type === "credits" && (
                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Number of Credits</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input required type="number" min="1" value={productForm.credits} onChange={e => setProductForm({...productForm, credits: e.target.value})} className="pl-9 bg-background border-input focus-visible:ring-ring" placeholder="e.g. 500" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">This saves directly to the Stripe Product Metadata.</p>
                </div>
              )}

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
      {priceModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold text-foreground">
                {priceModalType === "subscription" ? "Add Subscription Tier" : "Add Credit Bundle"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Create a new pricing option.</p>
            </div>
            
            <form onSubmit={handleCreatePrice} className="p-6 space-y-5">
              
              <div className="space-y-2">
                <Dropdown 
                  label="Select Parent Product"
                  options={parentProductOptions}
                  value={priceForm.product_id}
                  onChange={(val) => setPriceForm({ ...priceForm, product_id: val })}
                  placeholder="Choose a product..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Nickname</label>
                <Input value={priceForm.nickname} onChange={e => setPriceForm({...priceForm, nickname: e.target.value})} className="bg-background border-input focus-visible:ring-ring" placeholder="e.g. 500 Credits Promo" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input required type="number" step="0.01" min="0" value={priceForm.amount} onChange={e => setPriceForm({...priceForm, amount: e.target.value})} className="pl-9 bg-background border-input focus-visible:ring-ring" placeholder="99.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Dropdown 
                    label="Currency"
                    options={currencyOptions}
                    value={priceForm.currency}
                    onChange={(val) => setPriceForm({ ...priceForm, currency: val })}
                  />
                </div>
              </div>

              {priceModalType === "subscription" && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Dropdown 
                    label="Billing Interval"
                    options={intervalOptions}
                    value={priceForm.interval}
                    onChange={(val) => setPriceForm({ ...priceForm, interval: val as IntervalType })}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-border mt-6">
                <Button type="button" variant="outline" onClick={() => setPriceModalType(null)} className="w-full hover:cursor-pointer border-border">Cancel</Button>
                <Button type="submit" disabled={createPriceMutation.isPending || !priceForm.product_id} className="w-full bg-primary text-primary-foreground hover:cursor-pointer disabled:opacity-50">
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