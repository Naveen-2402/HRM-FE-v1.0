import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserProfile {
  sub: string; // Keycloak user ID
  email: string;
  preferred_username: string;
  realm_access?: { roles: string[] };
  organization?: Record<string, any>;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null;
  setToken: (token: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      user: null,

      setToken: (token: string) =>
        set({ token, isAuthenticated: true }),

      setUser: (user: UserProfile) =>
        set({ user }),

      logout: () =>
        set({ token: null, isAuthenticated: false, user: null }),
    }),
    {
      name: "hrm-auth-storage",
    }
  )
);