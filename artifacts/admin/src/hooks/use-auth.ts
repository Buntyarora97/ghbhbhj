import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "./use-api";
import { useLocation } from "wouter";

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const data = await fetchApi<any>("/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.admin));
      queryClient.setQueryData(["auth-status"], true);
      setLocation("/dashboard");
    },
  });

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    queryClient.setQueryData(["auth-status"], false);
    queryClient.clear();
    setLocation("/login");
  };

  const isAuthenticated = useQuery({
    queryKey: ["auth-status"],
    queryFn: () => !!localStorage.getItem("admin_token"),
    initialData: !!localStorage.getItem("admin_token"),
  });

  const adminUser = localStorage.getItem("admin_user") 
    ? JSON.parse(localStorage.getItem("admin_user") as string) 
    : null;

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout,
    isAuthenticated: isAuthenticated.data,
    adminUser,
  };
}
