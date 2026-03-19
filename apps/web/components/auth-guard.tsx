"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

// 1. Define routes that DO NOT require a login
const publicPaths = ["/login", "/signup", "/forgot-password", "/auth/callback"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // We need to wait for the component to mount so Zustand can safely read from localStorage
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Check if the current route is in our public list (or is the exact root landing page "/")
    const isPublicPath = publicPaths.some((path) => pathname?.startsWith(path)) || pathname === "/";

    if (!isAuthenticated && !isPublicPath) {
      // SCENARIO 1: Not logged in + trying to access a private page -> Kick to login
      router.replace("/login");
    } else if (isAuthenticated && isPublicPath && pathname !== "/auth/callback") {
      // SCENARIO 2: Logged in + trying to access login/signup -> Push to dashboard
      // Note: We intentionally let them access /auth/callback so the SSO flow can finish!
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isHydrated, pathname, router]);

  // Show a loading spinner while Zustand is loading or while calculating redirects
  if (!isHydrated) {
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

  // If all checks pass, render the actual page!
  return <>{children}</>;
}