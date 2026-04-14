"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  LogOut, 
  ShieldAlert,
  Briefcase,
  Bell,
  Tag
} from "lucide-react";
import { getRootOrigin } from "@repo/utils/src/domain";

import { useAuthStore } from "@/store/useAuthStore";
import { ModeToggle } from "@/components/theme-toggle"; 

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    window.location.href = `${getRootOrigin()}/login`;
  };

  const navLinks = [
    { name: "Platform Overview", href: "/superadmin/dashboard", icon: LayoutDashboard },
    { name: "Subscription Plans", href: "/superadmin/plans", icon: Package },
    { name: "Coupons", href: "/superadmin/coupons", icon: Tag },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        
        {/* Logo / Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-sidebar-border/50 shrink-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Briefcase className="size-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">AgentsFactory</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-destructive flex items-center gap-1">
              <ShieldAlert className="size-3" /> Superadmin
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Management</p>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:cursor-pointer",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                ].join(" ")}
              >
                <link.icon className="size-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-sidebar-border/50">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors hover:cursor-pointer"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area wrapper ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        
        {/* ── Top Header Bar ── */}
        <header className="flex h-16 items-center justify-end px-6 border-b border-border bg-card/50 backdrop-blur shrink-0 z-10">
          <div className="flex items-center gap-3">
            <ModeToggle />
            <button className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors hover:cursor-pointer">
              <Bell className="size-5" />
            </button>
          </div>
        </header>

        {/* ── Scrollable Page Content ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}