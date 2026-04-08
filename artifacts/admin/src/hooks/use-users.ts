import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "./use-api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => fetchApi<{ users: any[] }>("/users"),
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isBlocked }: { id: number; isBlocked: boolean }) => 
      fetchApi(`/users/${id}/block`, {
        method: "PATCH",
        body: JSON.stringify({ isBlocked }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useEditBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, operation }: { id: number; amount: number; operation: string }) => 
      fetchApi(`/users/${id}/balance`, {
        method: "PATCH",
        body: JSON.stringify({ amount, operation }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
