const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/admin`
  : "/api/admin";

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("admin_token");
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "An error occurred");
  }

  return data;
}
