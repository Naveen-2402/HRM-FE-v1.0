"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, token, user, setUser, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAndFetchUser = async () => {
      // 1. Check if token exists in local storage/Zustand
      if (!isAuthenticated || !token) {
        router.push("/login");
        return;
      }

      // // 2. If authenticated but user data isn't in Zustand yet, fetch it
      // if (!user) {
      //   try {
      //     // Note: You must create a GET /users/me endpoint in FastAPI that returns `get_current_user`
      //     const response = await axios.get("/users/me"); 
      //     setUser(response.data);
      //   } catch (error) {
      //     console.error("Failed to fetch user profile", error);
      //     // The Axios interceptor will automatically trigger logout if this is a 401
      //   }
      // }
      
      setIsChecking(false);
    };

    verifyAndFetchUser();
  }, [isAuthenticated, token, user, router, setUser]);

  // Show a loading state strictly using your predefined color classes while verifying
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="size-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading workspace...</p>
      </div>
    );
  }

  // Render the protected dashboard content
  return <>{children}</>;
}