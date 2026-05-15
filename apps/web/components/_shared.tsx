// Shared primitives used by SettingsPage tabs.
// Keep this file free of state and side-effects.

import { cn } from "@repo/ui/lib/utils";

export const AccentBar = () => (
  <div
    className="h-px w-full shrink-0 opacity-50"
    style={{
      background:
        "linear-gradient(90deg, transparent, var(--primary), var(--chart-2), var(--primary), transparent)",
    }}
  />
);

export const SectionCard: React.FC<{
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div
    className={cn(
      "rounded-3xl border border-border/50 bg-card shadow-premium transition-all duration-500 hover:shadow-indigo-500/5",
      "animate-in fade-in slide-in-from-bottom-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("glass-card rounded-3xl p-6 shadow-premium", className)}>
    {children}
  </div>
);

// Temporary export to test
export const TestSectionCard = SectionCard;

// Temporary: Old component for reference
// export const OldSectionCard = ({ children }: { children: React.ReactNode }) => (
//   <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
//     {children}
//   </div>
// );