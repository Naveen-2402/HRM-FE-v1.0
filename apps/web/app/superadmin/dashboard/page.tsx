"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { 
  Building2, CreditCard, Receipt, 
  ShieldAlert, LogOut, Loader2, MoreVertical, Search, Filter, Trash2
} from "lucide-react";
import { toast } from "react-toastify";

import { 
  useGetAllTenantsApiV1SuperadminTenantsGet,
  useGetEnumValuesApiV1SuperadminEnumsGet,
  useDeleteTenantApiV1SuperadminTenantTenantIdDelete
} from "@repo/orval-config/src/api/superadmin/superadmin";

import { SectionCard, AccentBar } from "@/components/_shared";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { ConfirmModal } from "@/components/_shared/ConfirmModal"

// ── Lazy Load Tab Components ─────────────────────────────────────────────
const SubscriptionsTab = dynamic(() => import("./components/subscriptionsTab"), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[600px] border border-border rounded-xl bg-card shadow-sm">
      <Loader2 className="size-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground font-medium">Loading subscriptions...</p>
    </div>
  ),
});

const PaymentsTab = dynamic(() => import("./components/paymentsTab"), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[600px] border border-border rounded-xl bg-card shadow-sm">
      <Loader2 className="size-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground font-medium">Loading payments...</p>
    </div>
  ),
});

// ── Status Helper ────────────────────────────────────────────────────────
export function getStatusBadge(status?: string) {
  const s = status?.toLowerCase() || "";
  if (["active", "paid", "success", "succeeded"].includes(s)) {
    return "bg-success/10 text-success border-success/20";
  }
  if (["suspended", "past_due", "canceled", "failed", "expired"].includes(s)) {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }
  if (["trialing", "pending", "paused"].includes(s)) {
    return "bg-warning/10 text-warning-foreground border-warning/20";
  }
  return "bg-muted text-muted-foreground border-border";
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
  const [activeTab, setActiveTab] = useState<"tenants" | "subscriptions" | "payments">("tenants");
  const logout = useAuthStore((state) => state.logout);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    tenantId: string;
    tenantName: string;
  }>({
    isOpen: false,
    tenantId: "",
    tenantName: "",
  });
  
  // Filtering & Pagination State for Tenants
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Using the exact param structure from your new OpenAPI spec
  const { data: tenantsData, isLoading: isLoadingTenants, refetch } = useGetAllTenantsApiV1SuperadminTenantsGet({
    page: page,
    page_size: pageSize,
    search: search || undefined
  });

  const deleteMutation = useDeleteTenantApiV1SuperadminTenantTenantIdDelete();

  const handleLogout = () => {
    logout();
    const baseDomain = window.location.hostname.includes(`${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}`)
      ? `${process.env.NEXT_PUBLIC_LOCAL_DOMAIN}:3000`
      : `${process.env.NEXT_PUBLIC_HOSTED_DOMAIN}`;
    window.location.href = `http://${baseDomain}/login`;
  };

  // 1. Function to open the modal
  const initiateDelete = (tenantId: string, tenantName: string) => {
    setDeleteModalState({ isOpen: true, tenantId, tenantName });
  };

  // 2. Function to execute the delete (passed to the modal)
  const executeDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ tenantId: deleteModalState.tenantId });
      toast.success(`${deleteModalState.tenantName} has been permanently deleted.`);
      
      // Close modal & refresh
      setDeleteModalState({ isOpen: false, tenantId: "", tenantName: "" });
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete tenant.");
      // Note: We leave the modal open if it fails so they can see the error,
      // or you can close it depending on preference.
    }
  };

  return (
    <div className="min-h-screen bg-background sm:px-8 px-4 py-8">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-destructive">
              <ShieldAlert className="inline size-3 mr-1 -mt-0.5" /> Superadmin
            </p>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground flex items-center gap-3">
              Platform Overview
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage all workspaces, active subscriptions, and revenue.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:cursor-pointer transition-colors"
            >
              <LogOut className="size-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        {/* ── Tab Navigation ────────────────────────────────────────────── */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted p-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "tenants", label: "Workspaces", icon: Building2 },
            { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
            { id: "payments", label: "Payments & Invoices", icon: Receipt },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={[
                "hover:cursor-pointer inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/60",
              ].join(" ")}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Dynamic Tab Content ───────────────────────────────────────── */}
        <div className="mt-6">
          {activeTab === "tenants" && (
            <SectionCard className="flex flex-col overflow-hidden min-h-[600px]">
              <AccentBar />
              
              {/* Toolbar */}
              <div className="border-b border-border bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by tenant name or domain..." 
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1); // Reset page on search
                    }}
                    className="pl-9 h-10 border-input bg-background focus-visible:ring-1 focus-visible:ring-ring w-full"
                  />
                </div>
                
                {/* <div className="flex items-center gap-3">
                  <Button variant="outline" className="h-10 border-border bg-card text-foreground hover:bg-muted hover:cursor-pointer">
                    <Filter className="size-4 mr-2" /> Filter
                  </Button>
                  <Button className="h-10 bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer shadow-sm">
                    Provision Tenant
                  </Button>
                </div> */}
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Tenant / Organization</th>
                      <th className="px-6 py-4">Domain</th>
                      <th className="px-6 py-4">Admin Email</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Created</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {isLoadingTenants ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-muted-foreground">Loading workspaces...</p>
                        </td>
                      </tr>
                    ) : tenantsData?.data?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          No workspaces found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      tenantsData?.data?.map((tenant: any) => (
                        <tr key={tenant.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-6 py-4 font-medium text-foreground">
                            {tenant.name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {tenant.subdomain}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground truncate max-w-[150px]" title={tenant.admin_email}>
                            {tenant.admin_email || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(tenant.status)}`}>
                              {tenant.status || "Active"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(tenant.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Delete Button */}
                              <button 
                                onClick={() => initiateDelete(tenant.id, tenant.name)}
                                disabled={deleteMutation.isPending}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors hover:cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                title="Delete Workspace"
                              >
                                {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                              </button>
                              
                              {/* Details Menu */}
                              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors hover:cursor-pointer">
                                <MoreVertical className="size-4" />
                              </button>
                            </div>
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
                  Showing {tenantsData?.data?.length || 0} of {tenantsData?.pagination?.total_items || 0} workspaces
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
                    disabled={page >= (tenantsData?.pagination?.total_pages || 1)}
                    onClick={() => setPage(p => p + 1)}
                    className="hover:cursor-pointer border-border"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === "subscriptions" && <SubscriptionsTab />}
          {activeTab === "payments" && <PaymentsTab />}
        </div>
      </div>
    
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, tenantId: "", tenantName: "" })}
        onConfirm={executeDelete}
        isLoading={deleteMutation.isPending}
        isDestructive={true}
        title="Delete Workspace"
        confirmText="Yes, delete workspace"
        description={
          <span className="space-y-2 block text-left">
            <span className="block">
              Are you sure you want to permanently delete <strong className="text-foreground">{deleteModalState.tenantName}</strong>?
            </span>
            <span className="block text-destructive/90 bg-destructive/10 p-3 rounded-lg border border-destructive/20 mt-3">
              This will instantly cancel their Stripe subscription, delete their Keycloak realm, and wipe their database schema. <strong>This action cannot be undone.</strong>
            </span>
          </span>
        }
      />
    </div>
  );
}