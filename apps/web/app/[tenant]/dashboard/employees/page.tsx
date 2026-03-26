"use client";

import { useMemo } from "react";
import { Search, ChevronUp, ChevronDown, Loader2, UserPlus } from "lucide-react";
import { useListEmployeesApiV1EmployeesGet } from "@repo/orval-config/src/api/employees/employees";
import { useEmployeeStore } from "@/store/useEmployeeStore";

export default function EmployeesPage() {
  const { searchQuery, sortField, sortOrder, skip, limit, setSearchQuery, setSort, setPage } = useEmployeeStore();

  // Fetch data using the Orval-generated hook
  // Assuming the API accepts skip and limit. If it accepts search/sort, add them here.
  const { data, isLoading, isError } = useListEmployeesApiV1EmployeesGet({
    skip,
    limit,
  });

  // Client-side Search & Sort Logic (Fallback in case backend doesn't handle it yet)
  const processedEmployees = useMemo(() => {
    if (!data?.employees) return [];

    let filtered = [...data.employees];

    // 1. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.first_name.toLowerCase().includes(query) ||
          emp.last_name.toLowerCase().includes(query)
      );
    }

    // 2. Sort Logic
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
        <button className="bg-primary text-primary-foreground hover:cursor-pointer px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 className="size-8 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-destructive">
                    Failed to load employees. Please try again.
                  </td>
                </tr>
              ) : processedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No employees found matching your criteria.
                  </td>
                </tr>
              ) : (
                processedEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium text-foreground">{employee.first_name}</td>
                    <td className="p-4 text-card-foreground">{employee.last_name}</td>
                    <td className="p-4 text-muted-foreground">{employee.email}</td>
                    <td className="p-4 capitalize text-card-foreground">{employee.tenant_role}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        employee.status === "active" 
                          ? "bg-primary/10 text-primary" 
                          : "bg-secondary/20 text-secondary-foreground"
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))
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