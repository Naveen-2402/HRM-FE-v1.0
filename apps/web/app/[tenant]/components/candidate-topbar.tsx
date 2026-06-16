"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut, Bell, Settings } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/theme-toggle";

interface CandidateTopbarProps {
  tenant: string;
  tenantName: string;
  tenantLogoUrl?: string;
  isAuthenticated: boolean;
  user?: {
    name?: string;
    first_name?: string;
    given_name?: string;
    family_name?: string;
    preferred_username?: string;
    email?: string;
    realm_access?: { roles?: string[] };
  } | null;
  logout: () => void;
  onBrandClick?: () => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onMyApplications?: () => void;
  onProfile?: () => void;
}

export function CandidateTopbar({
  tenant,
  tenantName,
  tenantLogoUrl,
  isAuthenticated,
  user,
  logout,
  onBrandClick,
  onSignIn,
  onSignUp,
  onMyApplications,
  onProfile,
}: CandidateTopbarProps) {
  const isCandidate = user?.realm_access?.roles?.includes("candidate");

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
  };

  return (
    <header className="fixed top-0 left-0 w-full z-[60] border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">

        {/* Left: Brand / Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={onBrandClick}
        >
          <img
            src="/logo.svg"
            alt={`${tenantName} Logo`}
            className="size-7 block dark:hidden"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <img
            src="/logo-dark.svg"
            alt={`${tenantName} Logo`}
            className="size-7 hidden dark:block"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="font-extrabold text-xl tracking-tight text-foreground">
            {tenantName || "Company Portal"}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          <ModeToggle />

          {isAuthenticated && isCandidate ? (
            <div className="flex items-center gap-2">
              <button
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
              </button>

              <div className="h-5 w-[1px] bg-border mx-1 hidden sm:block" />

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="size-9 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20 transition-all hover:bg-primary hover:text-primary-foreground shadow-sm cursor-pointer"
                >
                  {user?.given_name || user?.first_name || user?.name || user?.preferred_username
                    ? (user.given_name || user.first_name || user.name || user.preferred_username)!.charAt(0).toUpperCase()
                    : <User className="size-4" />}
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-border/50 mb-1">
                      <p className="text-sm font-bold text-foreground truncate">
                        {user?.name || `${user?.given_name || user?.first_name || ""} ${user?.family_name || ""}`.trim() || user?.preferred_username || "Candidate Workspace"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {user?.email || ""}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        if (onProfile) onProfile();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full text-left cursor-pointer"
                    >
                      <User className="size-4" />
                      Profile
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left cursor-pointer"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={onSignIn}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={onSignUp}
                className="text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 px-4 py-1.5 rounded-full shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
