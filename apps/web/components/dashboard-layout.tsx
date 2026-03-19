"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Briefcase, LayoutDashboard, Users, UserPlus, 
  Settings, LogOut, Menu, X, Bell 
} from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define our navigation items
  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/dashboard/employees", icon: Users },
    { name: "Invite Team", href: "/dashboard/employees/invite", icon: UserPlus },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-full">
        {/* Sidebar Header (Brand) */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 hover:cursor-pointer">
            <div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Briefcase className="size-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground tracking-tight">HRM</span>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:cursor-pointer ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}>
                  <item.icon className="size-5" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (User Profile & Logout) */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar">
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">
                {user?.first_name || "Admin User"}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {user?.email || "admin@workspace.com"}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-md text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors hover:cursor-pointer"
              title="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE OVERLAY & SIDEBAR --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Mobile Sidebar */}
          <aside className="relative w-64 max-w-xs bg-sidebar border-r border-sidebar-border h-full flex flex-col z-50 animate-in slide-in-from-left">
            <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                  <Briefcase className="size-4 text-sidebar-primary-foreground" />
                </div>
                <span className="font-bold text-lg text-sidebar-foreground">HRM</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md hover:cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <span className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:cursor-pointer ${
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}>
                      <item.icon className="size-5" />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-sidebar-border">
               <Button onClick={handleLogout} variant="destructive" className="w-full hover:cursor-pointer">
                 <LogOut className="mr-2 size-4" /> Log out
               </Button>
            </div>
          </aside>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-md hover:cursor-pointer"
            >
              <Menu className="size-5" />
            </button>
            <h2 className="text-lg font-semibold text-foreground capitalize hidden sm:block">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Overview'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors hover:cursor-pointer">
              <Bell className="size-5" />
            </button>
            {/* Optional: Add a user avatar dropdown here later */}
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}