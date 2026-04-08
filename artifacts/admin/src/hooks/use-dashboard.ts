import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./use-api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchApi<any>("/dashboard"),
    refetchInterval: 30000, // Refresh every 30s
  });
}
