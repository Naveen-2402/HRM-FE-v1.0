"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, Layers, DollarSign
} from "lucide-react";
import { toast } from "react-toastify";

import { 
  useCreateProductApiV1SuperadminProductsPost,
  getListPlansApiV1SuperadminPlansGetQueryKey
} from "@repo/orval-config/src/api/superadmin/superadmin";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Dropdown } from "@/components/_shared/Dropdown";

// Update your types
type ProductType = "subscription" | "credits";
type PricingType = "recurring" | "one_off";
type BillingPeriod = "monthly" | "yearly" | "every_3_months" | "every_6_months";

export default function CreateProductModal(props: any){
  const queryClient = useQueryClient();
  const { setIsProductModalOpen } = props;

  const [productForm, setProductForm] = useState({ 
    name: "", 
    description: "", 
    product_type: "subscription" as ProductType, 
    pricing_type: "recurring" as PricingType,
    default_price: "", 
    currency: "inr",
    billing_period: "monthly" as BillingPeriod,
    credits: "" 
  });

  // Add these options for your Dropdown components
  const pricingTypeOptions = [
    { label: "Recurring", value: "recurring" },
    { label: "One-Off", value: "one_off" },
  ];

  const billingPeriodOptions = [
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly (Every 3 Months)", value: "every_3_months" },
    { label: "Biannually (Every 6 Months)", value: "every_6_months" },
    { label: "Yearly", value: "yearly" },
  ];

  // ── Dropdown Options ──
  const productTypeOptions = [
    { label: "Subscription", value: "subscription" },
    { label: "Credits", value: "credits" },
  ];

  const currencyOptions = [
    { label: "INR", value: "inr" },
    { label: "USD", value: "usd" },
    { label: "EUR", value: "eur" },
  ];
    
  // ── Mutations ──
  const createProductMutation = useCreateProductApiV1SuperadminProductsPost();
  
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build Metadata (Credits only if applicable)
      const metadataPayload: any = {};
      if (productForm.product_type === "credits" && productForm.credits) {
        metadataPayload.credits = productForm.credits.toString();
      }

      // Build Base Payload
      const payload: any = {
        name: productForm.name,
        product_type: productForm.product_type,
        pricing_type: productForm.pricing_type,
        default_price: parseFloat(productForm.default_price),
        currency: productForm.currency,
      };

      if (productForm.description.trim()) {
        payload.description = productForm.description.trim();
      }

      if (Object.keys(metadataPayload).length > 0) {
        payload.metadata = metadataPayload;
      }

      if (productForm.pricing_type === "recurring") {
        payload.billing_period = productForm.billing_period;
      }

      await createProductMutation.mutateAsync({ data: payload });
      toast.success("Product created successfully in Stripe.");
      
      setIsProductModalOpen(false);
      setProductForm({ 
        name: "", description: "", product_type: "subscription", 
        pricing_type: "recurring", default_price: "", currency: "inr", 
        billing_period: "monthly", credits: "" 
      });
      queryClient.invalidateQueries({ queryKey: getListPlansApiV1SuperadminPlansGetQueryKey() });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to create product.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/30 rounded-t-2xl">
              <h2 className="text-xl font-bold text-foreground">Create New Product Container</h2>
              <p className="text-sm text-muted-foreground mt-1">Create a product and its default price in Stripe.</p>
            </div>
            
            <form onSubmit={handleCreateProduct} className="p-6 space-y-5">
              
              {/* Name & Desc */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Name</label>
                  <Input required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-10 bg-background border-input focus-visible:ring-ring" placeholder="e.g. Pro Plan or Credit Pack" />
                </div>
                
                {/* <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
                  <Input value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="bg-background border-input focus-visible:ring-ring" placeholder="Customer facing description" />
                </div> */}
              </div>

              {/* Configurations */}
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="space-y-2">
                  <Dropdown 
                    label="Product Type"
                    options={productTypeOptions}
                    value={productForm.product_type}
                    onChange={(val) => setProductForm({ ...productForm, product_type: val as ProductType })}
                  />
                </div>
                <div className="space-y-2">
                  <Dropdown 
                    label="Pricing Type"
                    disabled={productForm.product_type == "credits"}
                    options={pricingTypeOptions}
                    value={productForm.pricing_type}
                    onChange={(val) => setProductForm({ ...productForm, pricing_type: val as PricingType })}
                  />
                </div>
              </div>

              {/* Conditional: Credits */}
              {productForm.product_type === "credits" && (
                <div className="space-y-2 animate-in fade-in duration-200 bg-muted/20 p-3 rounded-lg border border-border">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Number of Credits</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input required type="number" min="1" value={productForm.credits} onChange={e => setProductForm({...productForm, credits: e.target.value})} className="pl-9 bg-background border-input focus-visible:ring-ring" placeholder="e.g. 500" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">This saves directly to the Stripe Product Metadata.</p>
                </div>
              )}

              {/* Default Price Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Price Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input required type="number" step="0.01" min="0" value={productForm.default_price} onChange={e => setProductForm({...productForm, default_price: e.target.value})} className="h-10 pl-9 bg-background border-input focus-visible:ring-ring" placeholder="99.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Dropdown 
                    label="Currency"
                    options={currencyOptions}
                    value={productForm.currency}
                    onChange={(val) => setProductForm({ ...productForm, currency: val })}
                  />
                </div>
              </div>

              {/* Conditional: Billing Period */}
              {productForm.product_type === "subscription" && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Dropdown 
                    label="Billing Period"
                    options={billingPeriodOptions}
                    value={productForm.billing_period}
                    onChange={(val) => setProductForm({ ...productForm, billing_period: val as BillingPeriod })}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-border mt-6">
                <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)} className="w-full hover:cursor-pointer border-border">Cancel</Button>
                <Button type="submit" disabled={createProductMutation.isPending || !productForm.default_price} className="w-full bg-primary text-primary-foreground hover:cursor-pointer">
                  {createProductMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create Product & Price"}
                </Button>
              </div>
            </form>
          </div>
        </div>
  )
}

