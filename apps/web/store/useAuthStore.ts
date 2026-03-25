import { create } from "zustand";
import { clearAuthToken, getClientAuthToken } from "@repo/utils"; // Adjust path to your utils package

export interface UserProfile {
  sub: string; // Keycloak user ID
  first_name?: string;
  email: string;
  preferred_username: string;
  realm_access?: { roles: string[] };
  organization?: Record<string, any> | string[];
  tenant_id?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initialize auth state directly from the cross-domain cookie
  isAuthenticated: !!getClientAuthToken(),
  user: null,

  login: (user: UserProfile) =>
    set({ user, isAuthenticated: true }),

  setUser: (user: UserProfile) =>
    set({ user }),

  logout: () => {
    // 1. Clear the cross-domain cookie
    clearAuthToken();

    // 2. Clear local state
    set({ isAuthenticated: false, user: null });

    // 3. Hard redirect back to the root domain login page
    if (typeof window !== "undefined") {
      const baseDomain = window.location.hostname.includes("localhost")
        ? "localhost:3000"
        : "hrm.com"; // Replace with your production root domain

      window.location.href = `http://${baseDomain}/login`;
    }
  },
}));