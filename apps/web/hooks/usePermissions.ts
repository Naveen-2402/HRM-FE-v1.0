import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

export function usePermissions() {
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-permissions"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/tenants/me/permissions");
      return response.data.permissions as string[];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasPermission = (permission: string) => {
    if (!data) return false;
    return data.includes(permission);
  };

  return {
    permissions: data || [],
    isLoading,
    isError,
    hasPermission,
  };
}
