"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { 
Loader2, Package, Layers
} from "lucide-react";
import { toast } from "react-toastify";

import { 
  useCreateCouponApiV1SuperadminCouponsPost,
  getListCouponsApiV1SuperadminCouponsGetQueryKey
} from "@repo/orval-config/src/api/coupons/coupons";
import { 
  useListPlansApiV1SuperadminPlansGet 
} from "@repo/orval-config/src/api/superadmin/superadmin";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Dropdown } from "@/components/_shared/Dropdown";

type DiscountType = "percentage" | "fixed_amount";

export default function CreateCouponModal(props: any){
  const { setIsCreateModalOpen } = props
  const queryClient = useQueryClient();
  
  const { data: plansData, isLoading: isLoadingPlans } = useListPlansApiV1SuperadminPlansGet();
  const plans = (plansData as any) || [];
  
  // ── Mutations ──
  const createMutation = useCreateCouponApiV1SuperadminCouponsPost();
    
  const form = useForm({
      defaultValues: {
        name: "",
        expires_in_hours: "48",
        discount_type: "percentage" as DiscountType,
        discount_value: "",
        currency: "inr",
        product_id: "",
        free_days_allocation: "0",
        free_credits_allocation: "0",
      },
      onSubmit: async ({ value }) => {
        try {
          const payload: any = {
            name: value.name,
            expires_in_hours: value.expires_in_hours ? Number(value.expires_in_hours) : null,
            discount_type: value.discount_type,
            discount_value: parseFloat(value.discount_value),
            currency: value.currency,
            free_days_allocation: Number(value.free_days_allocation) || 0,
            free_credits_allocation: Number(value.free_credits_allocation) || 0,
          };
  
          if (value.product_id && value.product_id.trim()) {
            payload.product_id = value.product_id.trim();
          }
  
          await createMutation.mutateAsync({ data: payload });
          toast.success("Coupon created successfully!");
          
          form.reset();
          setIsCreateModalOpen(false);
          queryClient.invalidateQueries({ queryKey: getListCouponsApiV1SuperadminCouponsGetQueryKey() });
          
        } catch (error: any) {
          toast.error(error?.response?.data?.detail || "Failed to create coupon.");
        }
      },
    });

  const productOptions = [
    { label: "Any Product (Platform Wide)", value: "" },
    ...plans.map((plan: any) => ({
      label: plan.name,
      value: plan.product_id,
      icon: plan.type === "credits" ? <Layers className="size-4" /> : <Package className="size-4" />
    }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold text-foreground">Generate Promotion Code</h2>
              <p className="text-sm text-muted-foreground mt-1">Create a new discount code for your tenants.</p>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }} 
              className="p-6 space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z.string().min(1, "Name is required").safeParse(value);
                      return res.success ? undefined : JSON.parse(res.error.message)[0].message;
                    }
                  }}
                  children={(field) => (
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Friendly Name</label>
                      <Input 
                        id={field.name}
                        value={field.state.value} 
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)} 
                        className="bg-background border-input focus-visible:ring-ring" 
                        placeholder="e.g. Diwali Sale" 
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] font-medium text-destructive">{field.state.meta.errors.join(',')}</p>
                      )}
                    </div>
                  )}
                />

                <form.Field
                  name="expires_in_hours"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return undefined;
                      const res = z.coerce.number().min(1, "Must be ≥ 1 hour").safeParse(value);
                      return res.success ? undefined : res.error.errors[0].message;
                    }
                  }}
                  children={(field) => (
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valid For (Hours)</label>
                      <Input 
                        id={field.name}
                        type="number"
                        value={field.state.value} 
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)} 
                        className="bg-background border-input focus-visible:ring-ring" 
                        placeholder="48" 
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] font-medium text-destructive">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 border-y border-border py-4">
                <form.Field
                  name="discount_type"
                  children={(field) => (
                    <div className="space-y-2 col-span-3 sm:col-span-1">
                      <label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                      <select 
                        id={field.name}
                        value={field.state.value} 
                        onBlur={field.handleBlur}
                        onChange={e => {
                          field.handleChange(e.target.value as DiscountType);
                          form.validateAllFields("change"); // Revalidate discount_value when type changes
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:cursor-pointer"
                      >
                        <option value="percentage">% Off</option>
                        <option value="fixed_amount">Fixed Amount</option>
                      </select>
                    </div>
                  )}
                />

                <form.Field
                  name="discount_value"
                  validators={{
                    onChangeListenTo: ["discount_type"],
                    onChange: ({ value, fieldApi }) => {
                      const type = fieldApi.form.getFieldValue("discount_type");
                      if (!value) return "Value is required";
                      
                      let schema = z.coerce.number().positive("Must be > 0");
                      if (type === "percentage") {
                        schema = schema.max(100, "Max 100%");
                      }
                      
                      const res = schema.safeParse(value);
                      return res.success ? undefined : JSON.parse(res.error.message)[0].message
                    }
                  }}
                  children={(field) => {
                    const discountType = form.getFieldValue("discount_type");
                    return (
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Discount value</label>
                        <Input 
                          id={field.name}
                          type="number" 
                          value={field.state.value} 
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)} 
                          className="bg-background h-10 border-input focus-visible:ring-ring" 
                          placeholder={discountType === "percentage" ? "30" : "5000"} 
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-[10px] font-medium text-destructive">{field.state.meta.errors.join(", ")}</p>
                        )}
                      </div>
                    );
                  }}
                />

                <form.Subscribe
                  selector={(state) => state.values.discount_type}
                  children={(discountType) => (
                    <form.Field
                      name="currency"
                      children={(field) => (
                        <div className="space-y-2 col-span-1 sm:col-span-1">
                          <label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Currency</label>
                          
                          <select 
                            id={field.name}
                            disabled={discountType === "percentage"}
                            value={field.state.value} 
                            onBlur={field.handleBlur}
                            onChange={e => field.handleChange(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:cursor-pointer uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="inr">INR</option>
                            <option value="usd">USD</option>
                          </select>
                        </div>
                      )}
                    />
                  )}
                />
              </div>

              <form.Field
                name="product_id"
                children={(field) => (
                  <div className="space-y-2">
                    <Dropdown
                      label="Restrict to Product (Optional)"
                      options={productOptions}
                      value={field.state.value}
                      onChange={field.handleChange}
                      disabled={isLoadingPlans}
                      placeholder={isLoadingPlans ? "Loading products..." : "Any Product (Platform Wide)"}
                    />
                    <p className="text-[10px] text-muted-foreground">Leave as "Any Product" to apply to any purchase. Select a specific product to restrict it.</p>
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                <form.Field
                  name="free_days_allocation"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return undefined;
                      const res = z.coerce.number().min(0, "Cannot be negative").safeParse(value);
                      return res.success ? undefined : res.error.errors[0].message;
                    }
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">+ Free Days</label>
                      <Input 
                        id={field.name}
                        type="number" 
                        value={field.state.value} 
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)} 
                        className="bg-background border-input focus-visible:ring-ring" 
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] font-medium text-destructive">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                />
                
                <form.Field
                  name="free_credits_allocation"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return undefined;
                      const res = z.coerce.number().min(0, "Cannot be negative").safeParse(value);
                      return res.success ? undefined : res.error.errors[0].message;
                    }
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">+ Free Credits</label>
                      <Input 
                        id={field.name}
                        type="number" 
                        value={field.state.value} 
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)} 
                        className="bg-background border-input focus-visible:ring-ring" 
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] font-medium text-destructive">{field.state.meta.errors.join(", ")}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    form.reset();
                    setIsCreateModalOpen(false);
                  }} 
                  className="w-full hover:cursor-pointer border-border"
                >
                  Cancel
                </Button>
                
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button 
                      type="submit" 
                      disabled={!canSubmit || isSubmitting || createMutation.isPending} 
                      className="w-full bg-primary text-primary-foreground hover:cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting || createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Generate Code"}
                    </Button>
                  )}
                />
              </div>
            </form>
          </div>
        </div>
  )
}