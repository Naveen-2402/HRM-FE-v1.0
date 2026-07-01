"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Loader2,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { ModeToggle } from "@/components/theme-toggle";
import { NotificationDropdown } from "@/components/notification-dropdown";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser, logout } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(!user);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside of profile dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setIsFetchingProfile(false);
        return;
      }
      setIsFetchingProfile(false);
    };
    fetchUserProfile();
  }, [user, setUser]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
  };

  if (isFetchingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="size-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">
          Loading workspace...
        </p>
      </div>
    );
  }

  // Handle differences in user object between models/DB
  const userName = user?.name || user?.first_name || "Admin Agentsfactory";
  const userInitials = userName.charAt(0).toUpperCase();
  const userEmail =
    user?.preferred_username || user?.email || "Admin Workspace";

  return (
    <div className="min-h-screen flex flex-col w-full h-full overflow-hidden bg-background text-foreground">
      {/* ── Sleek Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6 lg:px-10 max-w-[1600px] mx-auto w-full">
          {/* Left Side: Logo & Links */}
          <div className="flex items-center gap-8 lg:gap-12">
            {/* Logo / Brand */}
            <Link href="/dashboard" className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="AgentsFactory Logo"
                className="size-8 object-contain block dark:hidden"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <img
                src="/logo-dark.svg"
                alt="AgentsFactory Logo"
                className="size-8 object-contain hidden dark:block"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="font-black tracking-tight text-foreground text-xl hidden sm:block">
                AgentsFactory
              </span>
            </Link>
          </div>

          {/* Right Side: Tools & Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <ModeToggle />
              <NotificationDropdown />

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="size-9 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20 transition-all hover:bg-primary hover:text-primary-foreground shadow-sm cursor-pointer"
                >
                  {userName ? userInitials : <User className="size-4" />}
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-border/50 mb-1">
                      <p className="text-sm font-bold text-foreground truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {userEmail}
                      </p>
                    </div>

                    {hasPermission("candidate:read") && (
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full text-left"
                      >
                        <Settings className="size-4" />
                        Settings
                      </Link>
                    )}

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
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto w-full bg-background/50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full">
          {children}
        </div>
      </main>
    </div>
  );
}