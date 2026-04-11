"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { 
  Search, ChevronUp, ChevronDown, Loader2, UserPlus, Ban, UserCheck 
} from "lucide-react";
import { useRouter } from "next/navigation";

import { 
  useListEmployeesApiV1EmployeesGet,
  useDisableEmployeeApiV1EmployeesEmployeeIdDisablePatch,
  useEnableEmployeeApiV1EmployeesEmployeeIdEnablePatch,
  getListEmployeesApiV1EmployeesGetQueryKey
} from "@repo/orval-config/src/api/employees/employees";
import { useEmployeeStore } from "@/store/useEmployeeStore";

// Import your custom modal
import { ConfirmModal } from "@/components/_shared/ConfirmModal"; 

// ── Status Helper (Adapted for Employee Lifecycle) ─────────────
function getEmployeeStatusConfig(status?: string) {
  const s = status?.toLowerCase() ?? "";
  if (["active", "verified"].includes(s))
    return { dot: "bg-success", pill: "bg-success-subtle text-success border border-success/30" };
  if (["invited", "pending", "trialing"].includes(s))
    return { dot: "bg-warning", pill: "bg-warning-subtle text-warning-foreground border border-warning/30" };
  if (["disabled", "inactive", "suspended", "canceled"].includes(s))
    return { dot: "bg-destructive", pill: "bg-destructive/10 text-destructive border border-destructive/20" };
  return { dot: "bg-muted-foreground", pill: "bg-muted text-muted-foreground border border-border" };
}
// ───────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { searchQuery, sortField, sortOrder, skip, limit, setSearchQuery, setSort, setPage } = useEmployeeStore();
  const router = useRouter();

  // ── Modal States ──
  const [disableModalState, setDisableModalState] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
  }>({
    isOpen: false,
    employeeId: "",
    employeeName: "",
  });

  const [enableModalState, setEnableModalState] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
  }>({
    isOpen: false,
    employeeId: "",
    employeeName: "",
  });

  // Data Fetching
  const { data, isLoading, isError } = useListEmployeesApiV1EmployeesGet({
    skip,
    limit,
  });

  // Mutations
  const disableMutation = useDisableEmployeeApiV1EmployeesEmployeeIdDisablePatch();
  const enableMutation = useEnableEmployeeApiV1EmployeesEmployeeIdEnablePatch();

  // ── Handlers ──
  const initiateDisable = (employeeId: string, employeeName: string) => {
    setDisableModalState({ isOpen: true, employeeId, employeeName });
  };

  const executeDisable = async () => {
    const { employeeId, employeeName } = disableModalState;
    try {
      await disableMutation.mutateAsync({ employeeId });
      toast.success(`${employeeName}'s access has been disabled.`);
      
      setDisableModalState({ isOpen: false, employeeId: "", employeeName: "" });
      
      queryClient.invalidateQueries({
        queryKey: getListEmployeesApiV1EmployeesGetQueryKey({ skip, limit })
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to disable employee.";
      toast.error(errorMessage);
    }
  };

  const initiateEnable = (employeeId: string, employeeName: string) => {
    setEnableModalState({ isOpen: true, employeeId, employeeName });
  };

  const executeEnable = async () => {
    const { employeeId, employeeName } = enableModalState;
    try {
      await enableMutation.mutateAsync({ employeeId });
      toast.success(`${employeeName}'s access has been restored.`);
      
      setEnableModalState({ isOpen: false, employeeId: "", employeeName: "" });
      
      queryClient.invalidateQueries({
        queryKey: getListEmployeesApiV1EmployeesGetQueryKey({ skip, limit })
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to restore employee.";
      toast.error(errorMessage);
    }
  };

  // Client-side Search & Sort Logic
  const processedEmployees = useMemo(() => {
    if (!data?.employees) return [];

    let filtered = [...data.employees];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.first_name.toLowerCase().includes(query) ||
          emp.last_name.toLowerCase().includes(query)
      );
    }

    if (sortField) {
      filtered.sort((a, b) => {
        const valA = a[sortField].toLowerCase();
        const valB = b[sortField].toLowerCase();
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data?.employees, searchQuery, sortField, sortOrder]);

  const totalRecords = data?.total || 0;
  const totalPages = Math.ceil(totalRecords / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return (
    <div className="p-6 bg-background min-h-screen text-foreground space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your workspace employees and their access.</p>
        </div>
        <button 
          onClick={() => router.push("/dashboard/employees/invite")} 
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors hover:cursor-pointer px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-sm"
        >
          <UserPlus className="size-4" />
          Invite Employee
        </button>
      </div>

      {/* Controls Section (Search) */}
      <div className="flex items-center bg-card border border-border rounded-xl px-3 py-2 max-w-md focus-within:ring-1 focus-within:ring-ring shadow-sm">
        <Search className="size-4 text-muted-foreground mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search by first or last name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Table Section */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th 
                  className="px-6 py-4 hover:cursor-pointer select-none transition-colors hover:bg-muted/60"
                  onClick={() => setSort("first_name")}
                >
                  <div className="flex items-center gap-1.5">
                    First Name
                    {sortField === "first_name" && (
                      sortOrder === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 hover:cursor-pointer select-none transition-colors hover:bg-muted/60"
                  onClick={() => setSort("last_name")}
                >
                  <div className="flex items-center gap-1.5">
                    Last Name
                    {sortField === "last_name" && (
                      sortOrder === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="size-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-destructive">
                    Failed to load employees. Please try again.
                  </td>
                </tr>
              ) : processedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No employees found matching your criteria.
                  </td>
                </tr>
              ) : (
                processedEmployees.map((employee) => {
                  const s = employee.status?.toLowerCase();
                  const isDisabledStatus = s === "disabled" || s === "inactive";
                  const statusCfg = getEmployeeStatusConfig(s);
                  const isRoleAdmin = employee.tenant_role === "admin" || employee.tenant_role === "tenant-admin";
                  
                  return (
                    <tr key={employee.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-foreground">{employee.first_name}</td>
                      <td className="px-6 py-4 text-card-foreground">{employee.last_name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{employee.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase tracking-wider bg-secondary/50 border border-border text-secondary-foreground px-2.5 py-0.5 rounded-full font-bold">
                          {employee.tenant_role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.pill}`}>
                          <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
                          {employee.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isDisabledStatus ? (
                          <button
                            onClick={() => initiateEnable(employee.id, `${employee.first_name} ${employee.last_name}`)}
                            disabled={isRoleAdmin}
                            className="p-2 rounded-md text-muted-foreground hover:text-success hover:bg-success/10 transition-colors hover:cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:cursor-not-allowed opacity-0 group-hover:opacity-100"
                            title="Restore Access"
                          >
                            <UserCheck className="size-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => initiateDisable(employee.id, `${employee.first_name} ${employee.last_name}`)}
                            disabled={isRoleAdmin}
                            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors hover:cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:cursor-not-allowed opacity-0 group-hover:opacity-100"
                            title="Disable Access"
                          >
                            <Ban className="size-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && totalRecords > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{skip + 1}</span> to <span className="font-medium text-foreground">{Math.min(skip + limit, totalRecords)}</span> of <span className="font-medium text-foreground">{totalRecords}</span> records
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, skip - limit))}
                disabled={skip === 0}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-md text-foreground bg-card hover:bg-muted transition-colors hover:cursor-pointer disabled:opacity-50 disabled:hover:cursor-not-allowed shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(skip + limit)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-md text-foreground bg-card hover:bg-muted transition-colors hover:cursor-pointer disabled:opacity-50 disabled:hover:cursor-not-allowed shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Disable Modal ── */}
      <ConfirmModal
        isOpen={disableModalState.isOpen}
        onClose={() => setDisableModalState({ isOpen: false, employeeId: "", employeeName: "" })}
        onConfirm={executeDisable}
        isLoading={disableMutation.isPending}
        isDestructive={true}
        title="Revoke Access"
        confirmText="Yes, disable employee"
        description={
          <span className="space-y-2 block text-left">
            <span className="block">
              Are you sure you want to disable access for <strong className="text-foreground">{disableModalState.employeeName}</strong>?
            </span>
            <span className="block text-destructive/90 bg-destructive/10 p-3 rounded-lg border border-destructive/20 mt-3">
              They will be immediately logged out and blocked from signing back into this workspace. Their data will remain intact.
            </span>
          </span>
        }
      />

      {/* ── Confirm Enable Modal ── */}
      <ConfirmModal
        isOpen={enableModalState.isOpen}
        onClose={() => setEnableModalState({ isOpen: false, employeeId: "", employeeName: "" })}
        onConfirm={executeEnable}
        isLoading={enableMutation.isPending}
        isDestructive={false}
        title="Restore Access"
        confirmText="Yes, restore access"
        description={
          <span className="space-y-2 block text-left">
            <span className="block">
              Are you sure you want to restore access for <strong className="text-foreground">{enableModalState.employeeName}</strong>?
            </span>
            <span className="block text-muted-foreground mt-2">
              They will regain the ability to log in and access this workspace using their existing credentials.
            </span>
          </span>
        }
      />
    </div>
  );
}