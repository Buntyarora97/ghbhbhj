import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "./use-api";

export function useUpiAccounts() {
  return useQuery({
    queryKey: ["upi-accounts"],
    queryFn: () => fetchApi<{ upiAccounts: any[] }>("/upi"),
  });
}

export function useAddUpiAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { upiId: string; holderName?: string }) => 
      fetchApi("/upi", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upi-accounts"] });
    },
  });
}

export function useDeleteUpiAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchApi(`/upi/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upi-accounts"] });
    },
  });
}
