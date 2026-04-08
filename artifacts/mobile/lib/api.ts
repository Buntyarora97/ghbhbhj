import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://haryana-my-love-2jd4.onrender.com/api";

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("auth_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  requireAuth = true
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (requireAuth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const resp = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export const api = {
  auth: {
    register: (body: { name: string; phone: string; password: string; referralCode?: string }) =>
      request<{ success: boolean; token: string; user: any }>("POST", "/auth/register", body, false),
    login: (body: { phone: string; password: string }) =>
      request<{ success: boolean; token: string; user: any }>("POST", "/auth/login", body, false),
    me: () => request<any>("GET", "/auth/me"),
    referralInfo: () => request<{ referralCode: string; totalReferrals: number; totalEarnings: string }>("GET", "/referral/info"),
  },
  markets: {
    list: () => request<{ markets: any[] }>("GET", "/markets"),
  },
  bets: {
    place: (body: { marketId: number; gameType: string; number: string; amount: number }) =>
      request<{ success: boolean; bet: any; newBalance: string }>("POST", "/bets", body),
    placeMulti: (body: { marketId: number; bets: { gameType: string; number: string; amount: number }[] }) =>
      request<{ success: boolean; betsPlaced: number; totalAmount: string; newBalance: string; bets: any[] }>("POST", "/bets/multi", body),
    my: () => request<{ bets: any[] }>("GET", "/bets/my"),
  },
  wallet: {
    balance: () => request<{ balance: string }>("GET", "/wallet/balance"),
    transactions: () => request<{ transactions: any[] }>("GET", "/wallet/transactions"),
    activeUpi: () => request<{ upiId: string; holderName?: string }>("GET", "/wallet/active-upi"),
    deposit: (body: { amount: number; upiId: string; screenshotUrl?: string }) =>
      request<{ success: boolean; message: string }>("POST", "/wallet/deposit", body),
    withdraw: (body: { amount: number; upiId: string }) =>
      request<{ success: boolean; message: string }>("POST", "/wallet/withdraw", body),
  },
  results: {
    latest: () => request<{ results: any[] }>("GET", "/results/latest"),
  },
};
