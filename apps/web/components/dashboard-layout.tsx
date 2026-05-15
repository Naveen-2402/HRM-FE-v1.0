"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Briefcase, LayoutDashboard, Users, UserPlus, 
  Settings, LogOut, Menu, X, Bell, Handshake, UserSearch,
  ChevronRight, Search, Command
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { ModeToggle } from "@/components/theme-toggle";
import { getRootOrigin } from "@repo/utils/src/domain";

import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { hasPermission, isLoading } = usePermissions();

  // ── Dynamic Breadcrumbs ──────────────────────────────────────────────────
  const breadcrumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, index) => {
      const href = "/" + parts.slice(0, index + 1).join("/");
      const name = part.replace(/-/g, " ");
      return { name, href, isLast: index === parts.length - 1 };
    });
  }, [pathname]);

  // Mapping routes to required permissions
  const allNavItems = [
    { name: "Overview",    href: "/dashboard",                  icon: LayoutDashboard, permission: "orchestrator:read" },
    { name: "Employees",   href: "/dashboard/employees",         icon: Users,           permission: "employee:manage" },
    { name: "Invite Team", href: "/dashboard/employees/invite",  icon: UserPlus,        permission: "employee:manage" },
    { name: "Jobs",        href: "/dashboard/jobs",              icon: Handshake,       permission: "job:read" },
    { name: "Candidates",  href: "/dashboard/candidates",        icon: UserSearch,      permission: "candidate:read" },
    { name: "Settings",    href: "/dashboard/settings",          icon: Settings,        permission: "candidate:read" },
  ];

  const visibleNavItems = allNavItems.filter(item => hasPermission(item.permission));

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    window.location.href = `${getRootOrigin()}/login`;
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20">
      
      {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-full z-20 relative overflow-hidden">
        {/* Subtle Sidebar Gradient Decor */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
        
        <div className="h-20 flex items-center px-6 relative">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Briefcase className="size-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-sidebar-foreground tracking-tight leading-none text-tight">HRM</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50 font-bold mt-1">Workspace</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <span className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-black/5" 
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                }`}>
                  <item.icon className={`size-5 transition-colors ${isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"}`} />
                  <span className="tracking-tight">{item.name}</span>
                  {isActive && (
                    <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="rounded-2xl bg-sidebar-accent/30 border border-sidebar-border/50 p-4 transition-all hover:bg-sidebar-accent/50 group">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 text-primary font-bold text-sm">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-sidebar-foreground truncate tracking-tight">
                  {user?.name || "User Profile"}
                </span>
                <span className="text-[11px] text-sidebar-foreground/50 truncate font-medium">
                  {user?.preferred_username || "Workspace Admin"}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="size-8 flex items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                title="Log out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Glassmorphic Header */}
        <header className="h-16 glass border-b border-border/40 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              <Menu className="size-5" />
            </button>
            
            {/* Dynamic Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-2">
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {idx > 0 && <ChevronRight className="size-3.5 text-muted-foreground/40" />}
                  <Link 
                    href={crumb.href}
                    className={`text-sm font-medium capitalize transition-colors ${
                      crumb.isLast ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {crumb.name}
                  </Link>
                </div>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-8 w-px bg-border/40 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <ModeToggle />
              <button className="relative p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-all group">
                <Bell className="size-5" />
                <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-card" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background/50 p-6 lg:p-10">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {children}
          </div>
        </main>
      </div>

      {/* --- MOBILE OVERLAY (Simplified for brevity, similar to desktop) --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-72 bg-sidebar border-r border-sidebar-border h-full flex flex-col z-50 animate-in slide-in-from-left duration-300">
             <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                  <Briefcase className="size-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg text-sidebar-foreground text-tight">HRM</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-sidebar-foreground">
                <X className="size-5" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-black/5" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40"
                    }`}>
                      <item.icon className="size-5" />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-sidebar-border">
               <Button onClick={handleLogout} variant="destructive" className="w-full rounded-xl h-11">
                 <LogOut className="mr-2 size-4" /> Log out
               </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}