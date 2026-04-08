import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";

interface User {
  id: number;
  name: string;
  phone: string;
  upiId?: string;
  walletBalance: string;
  referralCode: string;
  isBlocked: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateBalance: (balance: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        if (storedToken) {
          setToken(storedToken);
          const userData = await api.auth.me();
          setUser(userData);
        }
      } catch {
        await AsyncStorage.removeItem("auth_token");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (phone: string, password: string) => {
    const resp = await api.auth.login({ phone, password });
    await AsyncStorage.setItem("auth_token", resp.token);
    setToken(resp.token);
    setUser(resp.user);
  };

  const register = async (name: string, phone: string, password: string, referralCode?: string) => {
    const resp = await api.auth.register({ name, phone, password, referralCode });
    await AsyncStorage.setItem("auth_token", resp.token);
    setToken(resp.token);
    setUser(resp.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.auth.me();
      setUser(userData);
    } catch {}
  };

  const updateBalance = (balance: string) => {
    if (user) setUser({ ...user, walletBalance: balance });
  };

  const value = useMemo(() => ({
    user, token, isLoading,
    isAuthenticated: !!user,
    login, register, logout, refreshUser, updateBalance,
  }), [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
