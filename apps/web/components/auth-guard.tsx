"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { getClientAuthToken } from "@repo/utils";
import { useAuthStore, UserProfile } from "@/store/useAuthStore";
import { useTenantRedirect } from "@/hooks/useTenantRedirect";

// 1. Define routes that DO NOT require a login
const publicPaths = ["/login", "/signup", "/forgot-password", "/auth/callback"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { redirectToTenantDashboard } = useTenantRedirect();
  
  // Grab the necessary actions and state from Zustand
  const { isAuthenticated, user, login, logout } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isRehydrating, setIsRehydrating] = useState(false);

  // Mark as mounted to safely execute browser-only logic
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- THE REHYDRATION ENGINE ---
  useEffect(() => {
    if (!isMounted) return;

    // If Zustand says we are authenticated, but the user object is missing,
    // it means we just hard-reloaded (or crossed subdomains) and lost Zustand's memory.
    if (isAuthenticated && !user) {
      setIsRehydrating(true);
      const token = getClientAuthToken();
      
      if (token) {
        try {
          // Rebuild the user profile from the cross-domain cookie
          const decodedUser = jwtDecode<UserProfile>(token);
          login(decodedUser);
        } catch (e) {
          console.error("Failed to decode token during rehydration", e);
          logout(); // Purge corrupted state
        } finally {
          setIsRehydrating(false);
        }
      } else {
        // Edge case: Cookie expired or was manually deleted
        logout();
        setIsRehydrating(false);
      }
    }
  }, [isMounted, isAuthenticated, user, login, logout]);

  // --- THE ROUTING ENGINE ---
  useEffect(() => {
    // Wait until we are fully mounted and finished rehydrating the user
    if (!isMounted || isRehydrating) return;

    const isPublicPath = publicPaths.some((path) => pathname?.startsWith(path)) || pathname === "/";

    if (!isAuthenticated && !isPublicPath) {
      // SCENARIO 1: Not logged in + trying to access a private page -> Kick to login
      router.replace("/login");
    } else if (isAuthenticated && isPublicPath && pathname !== "/auth/callback") {
      // SCENARIO 2: Logged in + trying to access login/signup -> Push to dashboard with tenant subdomain
      // Note: We intentionally let them access /auth/callback so the SSO flow can finish!
      redirectToTenantDashboard();
    }
  }, [isAuthenticated, isMounted, isRehydrating, pathname, router]);

  // Show a loading spinner while mounting OR while extracting the user from the cookie
  if (!isMounted || isRehydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPublicPath = publicPaths.some((path) => pathname?.startsWith(path)) || pathname === "/";
  
  // Prevent rendering the protected content for a split second before the redirect fires
  if (!isAuthenticated && !isPublicPath) {
    return null;
  }

  // If all checks pass and the user is fully rehydrated, render the app!
  return <>{children}</>;
}