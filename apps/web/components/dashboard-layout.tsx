"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Loader2, Bell, Moon, Sun, Settings, LogOut, User
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { Logo } from "./logo";
import { ModeToggle } from "@/components/theme-toggle";
import { NotificationDropdown } from "./notification-dropdown";
import { useGetPendingApprovalsApiV1ApprovalsPendingGet } from "@repo/orval-config/src/api/tenant/approvals/approvals";
import { customInstance } from "@repo/orval-config/src/axios-setup";
import { useQuery } from "@tanstack/react-query";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { hasPermission, isLoading } = usePermissions();

  // ── States for UI toggles ──
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside of profile dropdown to close it
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

  // ── Dynamic Permissions Routing ──
  const allNavItems = [
    { name: "Overview", href: "/dashboard", permission: "orchestrator:read" },
    { name: "Employees", href: "/dashboard/employees", permission: "employee:manage" },
    { name: "Jobs", href: "/dashboard/jobs", permission: "job:read" },
    { name: "Candidates", href: "/dashboard/candidates", permission: "candidate:read" },
    { name: "Interviews", href: "/dashboard/interviews", permission: "job:read" },
    { name: "Approvals", href: "/dashboard/approvals", permission: "approval:read" },
  ];

  const visibleNavItems = allNavItems.filter((item) => hasPermission(item.permission));

  // Fetch pending approvals for the orange dot
  // These hooks MUST be above the early return to satisfy React's Rules of Hooks
  const { data: standardPending } = useGetPendingApprovalsApiV1ApprovalsPendingGet({
    query: {
      enabled: !isLoading && hasPermission("approval:read") && !!user
    } as any
  });

  const { data: evaluationsPending } = useQuery({
    queryKey: ["pending-evaluations"],
    queryFn: () => customInstance<any[]>({ url: "/api/v1/jobs/evaluations/pending", method: "GET" }),
    enabled: !isLoading && hasPermission("approval:read") && !!user,
  });

  const hasPendingApprovals = (Array.isArray(standardPending) && standardPending.length > 0) || 
                              (Array.isArray(evaluationsPending) && evaluationsPending.length > 0);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle differences in user object between models/DB
  const userName = user?.name || user?.first_name || "Admin Agentsfactory";
  const userInitials = userName.charAt(0).toUpperCase();
  const userEmail = user?.preferred_username || user?.email || "Admin Workspace";

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">

      {/* ── Sleek Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6 lg:px-10 max-w-[1600px] mx-auto w-full">

          {/* Left Side: Logo & Links */}
          <div className="flex items-center gap-8 lg:gap-12">

            {/* Logo / Brand - Now clickable to go home */}
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="AgentsFactory Logo"
                className="size-8 object-contain block dark:hidden"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <img
                src="/logo-dark.svg"
                alt="AgentsFactory Logo"
                className="size-8 object-contain hidden dark:block"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="font-black tracking-tight text-foreground text-xl hidden sm:block">
                AgentsFactory
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5">
              {visibleNavItems.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all ${isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    {link.name}
                    {link.name === "Approvals" && hasPendingApprovals && (
                      <span className="absolute top-1 right-2 size-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
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

      {/* ── Mobile Scrollable Nav ── */}
      <div className="md:hidden border-b border-border/60 bg-card overflow-x-auto scrollbar-hide px-4 py-3">
        <nav className="flex items-center gap-2">
          {visibleNavItems.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
                  }`}
              >
                {link.name}
                {link.name === "Approvals" && hasPendingApprovals && (
                  <span className="absolute top-0 right-1 size-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto w-full bg-background/50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full">
          {children}
        </div>
      </main>

    </div>
  );
}
