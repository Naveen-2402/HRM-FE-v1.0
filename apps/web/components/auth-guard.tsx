"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { getClientAuthToken } from "@repo/utils";
import { useAuthStore, UserProfile } from "@/store/useAuthStore";
import { useTenantRedirect } from "@/hooks/useTenantRedirect";

// 1. Define routes that DO NOT require a login
const publicPaths = [
  "/login", 
  "/signup", 
  "/forgot-password", 
  "/auth/callback",
  "/candidate/login",
  "/candidate/register",
  "/candidate/callback",
  "/candidate/profile",
  "/candidate/dashboard",
  "/job"
];

// Helper function to strip dynamic tenant prefix for route safety check
function getCleanPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  const firstPart = parts[0];
  if (
    firstPart && 
    !["login", "signup", "forgot-password", "auth", "superadmin", "dashboard", "candidate", "job"].includes(firstPart)
  ) {
    return "/" + parts.slice(1).join("/");
  }
  return path;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { redirectToTenantDashboard } = useTenantRedirect();
  
  // Grab the necessary actions and state from Zustand
  const { isAuthenticated, user, login, logout } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isRehydrating, setIsRehydrating] = useState(isAuthenticated && !user);

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

    const cleanPath = getCleanPath(pathname || "");
    const isPublicPath = publicPaths.some((path) => cleanPath.startsWith(path)) || cleanPath === "/";

    if (!isAuthenticated && !isPublicPath) {
      // SCENARIO 1: Not logged in + trying to access a private page -> Kick to login
      router.replace("/login");
    } else if (isAuthenticated && isPublicPath && cleanPath !== "/auth/callback" && cleanPath !== "/candidate/callback") {
      // SCENARIO 2: Logged in + trying to access login/signup -> Push to dashboard with tenant subdomain
      // Note: We intentionally let them access /auth/callback so the SSO flow can finish!
      const isCandidate = user?.realm_access?.roles?.includes("candidate");
      if (!isCandidate) {
        redirectToTenantDashboard();
      }
    }
  }, [isAuthenticated, isMounted, isRehydrating, pathname, router, user]);

  // Show a loading spinner while mounting OR while extracting the user from the cookie
  if (!isMounted || isRehydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const cleanPath = getCleanPath(pathname || "");
  const isPublicPath = publicPaths.some((path) => cleanPath.startsWith(path)) || cleanPath === "/";
  
  // Prevent rendering the protected content for a split second before the redirect fires
  if (!isAuthenticated && !isPublicPath) {
    return null;
  }

  // If all checks pass and the user is fully rehydrated, render the app!
  return <>{children}</>;
}