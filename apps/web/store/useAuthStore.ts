import { create } from "zustand";
import { clearAuthToken, getClientAuthToken, getClientRefreshToken, isCandidateToken } from "@repo/utils";

export interface UserProfile {
  sub: string;
  name: string;
  email: string;
  first_name?: string;
  given_name: string;
  family_name: string;
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
    // Detect candidate role before clearing state
    const token = getClientAuthToken();
    const refreshToken = getClientRefreshToken();

    let isCandidateUser = false;
    if (useAuthStore.getState().user?.realm_access?.roles?.includes("candidate")) {
      isCandidateUser = true;
    } else if (token && isCandidateToken(token)) {
      isCandidateUser = true;
    } else if (refreshToken && isCandidateToken(refreshToken)) {
      isCandidateUser = true;
    } else if (typeof window !== "undefined") {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      isCandidateUser = pathSegments.includes("candidate") || pathSegments.includes("job");
    }

    // 1. Clear the cross-domain cookie
    clearAuthToken();

    // 2. Clear local state
    set({ isAuthenticated: false, user: null });

    // 3. Hard redirect back to the correct login page
    if (typeof window !== "undefined") {
      if (isCandidateUser) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const firstPart = pathParts[0];
        const isGeneral = firstPart ? ["login", "signup", "forgot-password", "auth", "superadmin", "dashboard", "pricing"].includes(firstPart) : false;
        let tenant = firstPart && !isGeneral ? firstPart : undefined;

        // Fallback to subdomain
        if (!tenant) {
          const hostname = window.location.hostname;
          const hostParts = hostname.split('.');
          if (hostParts.length > 2) {
            tenant = hostParts[0];
          }
        }

        if (tenant) {
          window.location.href = `${window.location.origin}/${tenant}/candidate/login`;
          return;
        }
      }

      const rawDomain = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
      window.location.href = `${rawDomain}/login`;
    }
  },
}));