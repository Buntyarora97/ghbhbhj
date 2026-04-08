import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./use-api";

export function useBetAnalytics(marketId?: number) {
  return useQuery({
    queryKey: ["bet-analytics", marketId],
    queryFn: () => {
      const url = marketId ? `/bet-analytics?marketId=${marketId}` : `/bet-analytics`;
      return fetchApi<any>(url);
    },
  });
}
