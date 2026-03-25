"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { DashboardShell } from "@/components/dashboard-layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuthStore();
  const [isFetchingProfile, setIsFetchingProfile] = useState(!user);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // If we already have the user in Zustand, skip fetching!
      if (user) {
        setIsFetchingProfile(false);
        return;
      }

      // try {
      //   // Fetch the enriched profile (which includes the organization_id!)
      //   const response = await axios.get("/users/me"); 
      //   setUser(response.data);
      // } catch (error) {
      //   console.error("Failed to fetch user profile", error);
      //   // If this fails with a 401, your Axios interceptor handles the logout automatically
      // } finally {
        setIsFetchingProfile(false);
      // }
    };

    fetchUserProfile();
  }, [user, setUser]);

  // Show a loading screen ONLY while fetching the fresh profile
  if (isFetchingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="size-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
        <DashboardShell>
          {children}
        </DashboardShell>
    </div>
  );
}