import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "./use-api";

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () => fetchApi<{ markets: any[] }>("/markets"),
  });
}

export function useCreateMarket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => 
      fetchApi("/markets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}

export function useUpdateMarket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => 
      fetchApi(`/markets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}

export function useDeleteMarket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => 
      fetchApi(`/markets/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}

export function useDeclareResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { marketId: number; resultNumber: string }) => 
      fetchApi("/results", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
