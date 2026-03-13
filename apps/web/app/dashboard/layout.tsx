import ProtectedRoute from "@/components/protected-route";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar will be injected here later */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header will be injected here later */}
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}