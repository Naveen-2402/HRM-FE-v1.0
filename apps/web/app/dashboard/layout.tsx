import ProtectedRoute from "@/components/protected-route";
import { DashboardShell } from "@/components/dashboard-layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground flex">
        <DashboardShell>
          {children}
        </DashboardShell>
      </div>
    </ProtectedRoute>
  );
}