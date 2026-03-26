"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { 
  Search, ChevronUp, ChevronDown, Loader2, UserPlus, Ban 
} from "lucide-react";
import { 
  useListEmployeesApiV1EmployeesGet,
  useDisableEmployeeApiV1EmployeesEmployeeIdDisablePatch,
  getListEmployeesApiV1EmployeesGetQueryKey
} from "@repo/orval-config/src/api/employees/employees"; // Adjust path if needed based on your file structure
import { useEmployeeStore } from "@/store/useEmployeeStore";
import { useRouter } from "next/navigation";

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { searchQuery, sortField, sortOrder, skip, limit, setSearchQuery, setSort, setPage } = useEmployeeStore();
  const router = useRouter();

  // Track which employee is currently being disabled to show a row-specific spinner
  const [disablingId, setDisablingId] = useState<string | null>(null);

  // Data Fetching
  const { data, isLoading, isError } = useListEmployeesApiV1EmployeesGet({
    skip,
    limit,
  });

  // Mutations
  const disableMutation = useDisableEmployeeApiV1EmployeesEmployeeIdDisablePatch();

  // Disable Handler
  const handleDisableEmployee = async (employeeId: string, employeeName: string) => {
    if (!window.confirm(`Are you sure you want to disable access for ${employeeName}? They will immediately lose access to the workspace.`)) {
      return;
    }

    setDisablingId(employeeId);
    try {
      await disableMutation.mutateAsync({ employeeId });
      toast.success(`${employeeName}'s access has been disabled.`);
      
      // Invalidate the list query to instantly refresh the table data
      queryClient.invalidateQueries({
        queryKey: getListEmployeesApiV1EmployeesGetQueryKey({ skip, limit })
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to disable employee.";
      toast.error(errorMessage);
    } finally {
      setDisablingId(null);
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
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground text-sm">Manage your workspace employees and their access.</p>
        </div>
        <button onClick={()=>router.push("/dashboard/employees/invite")} className="bg-primary text-primary-foreground hover:cursor-pointer px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium">
          <UserPlus className="size-4" />
          Invite Employee
        </button>
      </div>

      {/* Controls Section (Search) */}
      <div className="flex items-center bg-card border border-border rounded-lg px-3 py-2 max-w-md focus-within:ring-2 focus-within:ring-ring">
        <Search className="size-5 text-muted-foreground mr-2" />
        <input
          type="text"
          placeholder="Search by first or last name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Table Section */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                <th 
                  className="p-4 font-medium hover:cursor-pointer select-none"
                  onClick={() => setSort("first_name")}
                >
                  <div className="flex items-center gap-1">
                    First Name
                    {sortField === "first_name" && (
                      sortOrder === "asc" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 font-medium hover:cursor-pointer select-none"
                  onClick={() => setSort("last_name")}
                >
                  <div className="flex items-center gap-1">
                    Last Name
                    {sortField === "last_name" && (
                      sortOrder === "asc" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />
                    )}
                  </div>
                </th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="size-8 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-destructive">
                    Failed to load employees. Please try again.
                  </td>
                </tr>
              ) : processedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No employees found matching your criteria.
                  </td>
                </tr>
              ) : (
                processedEmployees.map((employee) => {
                  // Assuming your API returns "disabled" or similar when inactive
                  const isDisabledStatus = employee.status === "disabled" || employee.status === "inactive";
                  
                  return (
                    <tr key={employee.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium text-foreground">{employee.first_name}</td>
                      <td className="p-4 text-card-foreground">{employee.last_name}</td>
                      <td className="p-4 text-muted-foreground">{employee.email}</td>
                      <td className="p-4 capitalize text-card-foreground">{employee.tenant_role}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          employee.status === "active" 
                            ? "bg-primary/10 text-primary" 
                            : isDisabledStatus
                            ? "bg-destructive/10 text-destructive"
                            : "bg-secondary/20 text-secondary-foreground"
                        }`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDisableEmployee(employee.id, `${employee.first_name} ${employee.last_name}`)}
                          disabled={disablingId === employee.id || isDisabledStatus || employee.tenant_role === "admin"} // Optional: Prevent admins from disabling themselves here too
                          className="p-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors hover:cursor-pointer disabled:opacity-50 disabled:hover:cursor-not-allowed"
                          title="Disable Access"
                        >
                          {disablingId === employee.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Ban className="size-4" />
                          )}
                        </button>
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
          <div className="flex items-center justify-between p-4 border-t border-border bg-card">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{skip + 1}</span> to <span className="font-medium text-foreground">{Math.min(skip + limit, totalRecords)}</span> of <span className="font-medium text-foreground">{totalRecords}</span> results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, skip - limit))}
                disabled={skip === 0}
                className="px-3 py-1 text-sm border border-border rounded-md text-foreground bg-background hover:bg-muted hover:cursor-pointer disabled:opacity-50 disabled:hover:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(skip + limit)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm border border-border rounded-md text-foreground bg-background hover:bg-muted hover:cursor-pointer disabled:opacity-50 disabled:hover:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}