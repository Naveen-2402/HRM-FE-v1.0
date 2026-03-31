"use client";

import React, { useState } from "react";
import { Loader2, Search, ExternalLink, Receipt } from "lucide-react";
import { useGetAllPaymentsApiV1SuperadminPaymentsGet } from "@repo/orval-config/src/api/superadmin/superadmin";

import { SectionCard, AccentBar } from "@/components/_shared";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { getStatusBadge } from "../page";

export default function PaymentsTab() {
  const [limit] = useState(10); // Using limit param as required by this specific endpoint

  const { data: paymentsData, isLoading } = useGetAllPaymentsApiV1SuperadminPaymentsGet({
    limit: limit
  });

  // Assuming Stripe-like payment structure from the backend
  const payments = (paymentsData as any)?.data || [];

  return (
    <SectionCard className="flex flex-col overflow-hidden min-h-[600px] animate-in fade-in duration-300">
      <AccentBar />
      
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search payments..." 
            className="pl-9 h-10 border-input bg-background focus-visible:ring-1 focus-visible:ring-ring w-full"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
            <tr>
              <th className="px-6 py-4">Charge ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading recent payments...</p>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No payment records found.
                </td>
              </tr>
            ) : (
              payments.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-foreground">
                    <div className="flex items-center gap-2">
                      <Receipt className="size-3 text-muted-foreground shrink-0" />
                      {payment.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    {payment.billing_details.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    {/* Assuming Stripe standard amounts (cents) */}
                    {(payment.amount / 100).toLocaleString('en-US', { style: 'currency', currency: payment.currency || 'USD' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(payment.status)}`}>
                      {payment.status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {/* Assuming Stripe standard unix timestamps */}
                    {new Date(payment.created * 1000).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {payment.receipt_url ? (
                      <a 
                        href={payment.receipt_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        View <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="border-t border-border bg-muted/10 p-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing up to {limit} most recent payments
        </p>
      </div>
    </SectionCard>
  );
}