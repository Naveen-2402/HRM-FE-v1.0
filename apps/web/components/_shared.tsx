// Shared primitives used by SettingsPage tabs.
// Keep this file free of state and side-effects.

export const AccentBar = () => (
  <div
    className="h-[3px] w-full shrink-0"
    style={{
      background:
        "linear-gradient(90deg, var(--chart-3), var(--chart-2), var(--chart-1))",
    }}
  />
);

export const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
    {children}
  </div>
);