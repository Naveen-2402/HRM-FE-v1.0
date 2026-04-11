"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Ticket, Plus, Trash2, Loader2, Copy, Clock, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "react-toastify";

import { 
  useListCouponsApiV1SuperadminCouponsGet,
  useDeleteCouponApiV1SuperadminCouponsCouponIdDelete,
  getListCouponsApiV1SuperadminCouponsGetQueryKey
} from "@repo/orval-config/src/api/coupons/coupons";
import { Button } from "@repo/ui/components/ui/button";
import { SectionCard, AccentBar } from "@/components/_shared";
import { ConfirmModal } from "@/components/_shared/ConfirmModal";
import CreateCouponModalLoader from "./components/CreateCouponModalLoader";

const CreateCouponModal = dynamic(() => import("./components/CreateCouponModal"), { 
    ssr: false, 
    loading: () => <CreateCouponModalLoader /> 
  });

export default function CouponsPage() {
  const queryClient = useQueryClient();

  // ── Data Fetching ──
  const { data: couponsData, isLoading: isLoadingCoupons } = useListCouponsApiV1SuperadminCouponsGet();
  const coupons = (couponsData as any) || [];

  // ── Mutations ──
  const deleteMutation = useDeleteCouponApiV1SuperadminCouponsCouponIdDelete();

  // ── Modal States ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    couponId: string;
    couponCode: string;
  }>({
    isOpen: false,
    couponId: "",
    couponCode: "",
  });

  // ── Handlers ──
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ couponId: deleteModalState.couponId });
      toast.success(`Coupon ${deleteModalState.couponCode} deleted.`);
      setDeleteModalState({ isOpen: false, couponId: "", couponCode: "" });
      queryClient.invalidateQueries({ queryKey: getListCouponsApiV1SuperadminCouponsGetQueryKey() });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete coupon.");
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success("Promo code copied to clipboard!"))
        .catch(() => toast.error("Failed to copy code."));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success("Promo code copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy code.");
      } finally {
        textArea.remove();
      }
    }
  };

  const isExpired = (dateString?: string | null) => {
    if (!dateString) return false;
    return new Date(dateString).getTime() < new Date().getTime();
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Promotion Codes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate and manage discount codes to distribute to your tenants.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer shadow-sm"
        >
          <Plus className="size-4 mr-2" /> New Coupon
        </Button>
      </div>

      <SectionCard className="flex flex-col overflow-hidden min-h-[500px]">
        <AccentBar />
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Promo Code</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Allocations</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Expires At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoadingCoupons ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading coupons...</p>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Ticket className="size-8 opacity-20 mx-auto mb-3" />
                    No active coupons found. Create one to get started.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon: any) => {
                  const expired = isExpired(coupon.expires_at);
                  
                  return (
                    <tr key={coupon.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground bg-muted px-2.5 py-1 rounded-md border border-border tracking-wider text-xs">
                            {coupon.code}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(coupon.code)}
                            className="text-muted-foreground hover:text-primary transition-colors hover:cursor-pointer"
                            title="Copy Code"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {coupon.discount_type === "percentage" 
                          ? `${coupon.discount_value}% OFF`
                          : `₹${coupon.discount_value} OFF`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {coupon.free_days_allocation > 0 && (
                            <span>+{coupon.free_days_allocation} Days Free</span>
                          )}
                          {coupon.free_credits_allocation > 0 && (
                            <span>+{coupon.free_credits_allocation} Credits</span>
                          )}
                          {!coupon.free_days_allocation && !coupon.free_credits_allocation && (
                            <span className="opacity-50">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {expired ? (
                          <span className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <XCircle className="size-3" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-success/10 text-success border border-success/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="size-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {coupon.expires_at ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            {new Date(coupon.expires_at).toLocaleString()}
                          </div>
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setDeleteModalState({ isOpen: true, couponId: coupon.id, couponCode: coupon.code })}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors hover:cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Delete Coupon"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Create Coupon Modal ── */}
      {isCreateModalOpen && (
        <CreateCouponModal setIsCreateModalOpen={setIsCreateModalOpen}/>
      )}

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, couponId: "", couponCode: "" })}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        isDestructive={true}
        title="Expire Coupon"
        confirmText="Yes, delete coupon"
        description={
          <span className="space-y-2 block text-left">
            <span className="block">
              Are you sure you want to delete <strong className="text-foreground">{deleteModalState.couponCode}</strong>?
            </span>
            <span className="block text-destructive/90 bg-destructive/10 p-3 rounded-lg border border-destructive/20 mt-3">
              This will instantly invalidate the code in Stripe. Tenants will no longer be able to use it during checkout.
            </span>
          </span>
        }
      />
    </div>
  );
}