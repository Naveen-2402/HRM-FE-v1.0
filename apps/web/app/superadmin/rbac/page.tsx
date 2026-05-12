"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheck, Plus, Trash2, Loader2, ShieldAlert, CheckCircle2, Search
} from "lucide-react";
import { toast } from "react-toastify";

import { 
  useListRolePermissionsApiV1SuperadminRbacPermissionsGet,
  useRemoveRolePermissionApiV1SuperadminRbacPermissionsDelete,
  getListRolePermissionsApiV1SuperadminRbacPermissionsGetQueryKey
} from "@repo/orval-config/src/api/superadmin/superadmin/superadmin";
import { Button } from "@repo/ui/components/ui/button";
import { SectionCard, AccentBar } from "@/components/_shared";
import { ConfirmModal } from "@/components/_shared/ConfirmModal";
import AddPermissionModal from "./components/AddPermissionModal";

export default function RBACManagementPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // ── Data Fetching ──
  const { data: permissionsData, isLoading } = useListRolePermissionsApiV1SuperadminRbacPermissionsGet();
  const permissions = (permissionsData as any) || [];

  // ── Mutations ──
  const removeMutation = useRemoveRolePermissionApiV1SuperadminRbacPermissionsDelete();

  // ── Modal States ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [removeModalState, setRemoveModalState] = useState<{
    isOpen: boolean;
    roleName: string;
    permission: string;
  }>({
    isOpen: false,
    roleName: "",
    permission: "",
  });

  // ── Handlers ──
  const handleRemove = async () => {
    try {
      await removeMutation.mutateAsync({ 
        params: {
          role_name: removeModalState.roleName,
          permission: removeModalState.permission
        }
      });
      toast.success(`Permission removed from ${removeModalState.roleName}.`);
      setRemoveModalState({ isOpen: false, roleName: "", permission: "" });
      queryClient.invalidateQueries({ queryKey: getListRolePermissionsApiV1SuperadminRbacPermissionsGetQueryKey() });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to remove permission.");
    }
  };

  const filteredPermissions = permissions.filter((p: any) => 
    p.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.permission.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce((acc: Record<string, any[]>, curr: any) => {
    const roleName = curr.role_name;
    if (!acc[roleName]) {
      acc[roleName] = [];
    }
    acc[roleName]!.push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-wide text-foreground flex items-center gap-3">
            RBAC Registry
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage global role-to-permission associations across the platform.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer shadow-sm"
        >
          <Plus className="size-4 mr-2" /> Add Association
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by role or permission..." 
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-success" />
          <span>Centralized Registry</span>
        </div>
      </div>

      <SectionCard className="flex flex-col overflow-hidden min-h-[500px]">
        <AccentBar />
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Role Group</th>
                <th className="px-6 py-4">Permission String</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Fetching registry...</p>
                  </td>
                </tr>
              ) : filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <ShieldAlert className="size-8 opacity-20 mx-auto mb-3" />
                    No permissions found {searchQuery && "matching your search"}.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedPermissions).map(([roleName, rolePermissions]) => (
                  <React.Fragment key={roleName}>
                    <tr className="bg-muted/30 border-y border-border/50">
                      <td colSpan={5} className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-3.5 text-primary" />
                          <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                            {roleName} Role
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium ml-1">
                            ({(rolePermissions as any[]).length} permissions)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {(rolePermissions as any[]).map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 pl-4">
                            <div className="size-1.5 rounded-full bg-primary/40" />
                            <span className="font-medium text-muted-foreground uppercase tracking-tight text-[10px]">
                              {reg.role_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-primary font-mono text-xs bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                            {reg.permission}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-success text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="size-3" /> Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(reg.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setRemoveModalState({ 
                              isOpen: true, 
                              roleName: reg.role_name, 
                              permission: reg.permission 
                            })}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors hover:cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Remove Association"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Add Permission Modal ── */}
      {isAddModalOpen && (
        <AddPermissionModal onClose={() => setIsAddModalOpen(false)} />
      )}

      {/* ── Confirm Remove Modal ── */}
      <ConfirmModal
        isOpen={removeModalState.isOpen}
        onClose={() => setRemoveModalState({ isOpen: false, roleName: "", permission: "" })}
        onConfirm={handleRemove}
        isLoading={removeMutation.isPending}
        isDestructive={true}
        title="Remove Permission Mapping"
        confirmText="Remove Association"
        description={
          <span className="space-y-2 block text-left">
            <span className="block">
              Are you sure you want to remove <code className="text-primary">{removeModalState.permission}</code> from the <strong className="text-foreground uppercase">{removeModalState.roleName}</strong> role?
            </span>
            <span className="block text-destructive/90 bg-destructive/10 p-3 rounded-lg border border-destructive/20 mt-3 text-xs">
              Warning: This change is global. All users currently assigned this role will immediately lose this permission after the cache expires.
            </span>
          </span>
        }
      />
    </div>
  );
}
