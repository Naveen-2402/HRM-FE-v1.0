import { create } from "zustand";

type SortField = "first_name" | "last_name" | null;
type SortOrder = "asc" | "desc";

interface EmployeeState {
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  skip: number;
  limit: number;
  setSearchQuery: (query: string) => void;
  setSort: (field: SortField) => void;
  setPage: (skip: number) => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  searchQuery: "",
  sortField: null,
  sortOrder: "asc",
  skip: 0,
  limit: 10,
  setSearchQuery: (query) => set({ searchQuery: query, skip: 0 }), // Reset to page 1 on search
  setSort: (field) =>
    set((state) => ({
      sortField: field,
      sortOrder: state.sortField === field && state.sortOrder === "asc" ? "desc" : "asc",
    })),
  setPage: (skip) => set({ skip }),
}));