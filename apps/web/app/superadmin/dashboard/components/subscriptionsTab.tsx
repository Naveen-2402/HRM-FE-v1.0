"use client";

import React, { useState } from "react";
import { Loader2, Filter, MoreVertical, CreditCard, ChevronDown } from "lucide-react";
import { 
  useGetAllSubscriptionsApiV1SuperadminSubscriptionsGet,
  useGetEnumValuesApiV1SuperadminEnumsGet 
} from "@repo/orval-config/src/api/superadmin/superadmin";

import { SectionCard, AccentBar } from "@/components/_shared";
import { Button } from "@repo/ui/components/ui/button";
import { getStatusBadge } from "../page";

export default function SubscriptionsTab() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>("");

  // Fetch Enums for the dropdowns
  const { data: enums } = useGetEnumValuesApiV1SuperadminEnumsGet();

  // Fetch Subscriptions with active filters
  const { data: subsData, isLoading } = useGetAllSubscriptionsApiV1SuperadminSubscriptionsGet({
    page: page,
    page_size: pageSize,
    ...(statusFilter && { status: statusFilter as any }),
    ...(planFilter && { plan: planFilter }),
  });

  // Safe extract of enum arrays (with fallbacks if the backend schema changes)
  const statusOptions: string[] = (enums as any)?.subscription_statuses || [];
  const planOptions: string[] = (enums as any)?.subscription_plans || (enums as any)?.plans || ["monthly", "quarterly", "yearly"];

  return (
    <SectionCard className="flex flex-col overflow-hidden min-h-[600px] animate-in fade-in duration-300">
      <AccentBar />
      
      {/* ── Toolbar: Dropdown Filters ── */}
      <div className="border-b border-border bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Filter className="size-4" />
          <span>Filter Records</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          
          {/* Plan Type Dropdown */}
          <div className="relative w-full sm:w-48">
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1); // Reset to page 1 on filter change
              }}
              className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:cursor-pointer pr-10 capitalize"
            >
              <option value="">All Plans</option>
              {planOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 size-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1); // Reset to page 1 on filter change
              }}
              className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:cursor-pointer pr-10 capitalize"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 size-4 text-muted-foreground pointer-events-none" />
          </div>

        </div>
      </div>

      {/* ── Data Table ── */}
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
                  No subscriptions found matching your filters.
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
                  <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
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
      
      {/* ── Pagination Footer ── */}
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