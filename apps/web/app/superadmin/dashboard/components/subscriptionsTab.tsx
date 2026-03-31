"use client";

import React, { useState } from "react";
import { Loader2, Search, Filter, MoreVertical, CreditCard } from "lucide-react";
import { useGetAllSubscriptionsApiV1SuperadminSubscriptionsGet } from "@repo/orval-config/src/api/superadmin/superadmin";

import { SectionCard, AccentBar } from "@/components/_shared";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { getStatusBadge } from "../page";

export default function SubscriptionsTab() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch data ONLY when this component renders
  const { data: subsData, isLoading } = useGetAllSubscriptionsApiV1SuperadminSubscriptionsGet({
    page: page,
    page_size: pageSize,
  });

  return (
    <SectionCard className="flex flex-col overflow-hidden min-h-[600px] animate-in fade-in duration-300">
      <AccentBar />
      
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search subscriptions..." 
            className="pl-9 h-10 border-input bg-background focus-visible:ring-1 focus-visible:ring-ring w-full"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 border-border bg-card text-foreground hover:bg-muted hover:cursor-pointer">
            <Filter className="size-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
            <tr>
              <th className="px-6 py-4">Subscription ID</th>
              <th className="px-6 py-4">Customer ID</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Current Period</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading subscriptions...</p>
                </td>
              </tr>
            ) : subsData?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No subscriptions found matching your criteria.
                </td>
              </tr>
            ) : (
              subsData?.data?.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-foreground truncate max-w-[180px]" title={sub.stripe_subscription_id}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-3 text-muted-foreground shrink-0" />
                      {sub.stripe_subscription_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    {sub.stripe_customer_id}
                  </td>
                  <td className="px-6 py-4 capitalize font-medium text-foreground">
                    {sub.plan}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(sub.status)}`}>
                      {sub.status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(sub.current_period_start).toLocaleDateString()} <span className="mx-1 text-border">→</span> {new Date(sub.current_period_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors hover:cursor-pointer">
                      <MoreVertical className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="border-t border-border bg-muted/10 p-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {subsData?.data?.length || 0} of {subsData?.pagination?.total_items || 0} subscriptions
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="hover:cursor-pointer border-border"
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page >= (subsData?.pagination?.total_pages || 1)}
            onClick={() => setPage(p => p + 1)}
            className="hover:cursor-pointer border-border"
          >
            Next
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}