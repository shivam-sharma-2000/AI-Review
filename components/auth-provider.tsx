"use client";

import * as React from "react";
import { setToken, apiFetch } from "@/lib/api-client";

export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  trialProfile?: {
    id: string;
    reviewCount: number;
    reviewLimit: number;
    plan: string;
    trialEnd: string;
    createdAt: string;
  } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Sync profile with the backend
  const checkProfile = React.useCallback(async () => {
    try {
      // Fetch current session profile. Skip automatic error handling to prevent redirection loops
      const response = await apiFetch("/api/profile/me", { skipAuthErrorHandling: true });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error("Failed to load authenticated user profile:", error);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkProfile();
  }, [checkProfile]);

  const login = React.useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login request failed.");
    }

    setToken(data.token);
    await checkProfile();
  }, [checkProfile]);

  const register = React.useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration request failed.");
    }
  }, []);

  const verifyEmail = React.useCallback(async (email: string, code: string) => {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Verification failed.");
    }

    setToken(data.token);
    await checkProfile();
  }, [checkProfile]);

  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = React.useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    verifyEmail,
    logout,
  }), [user, loading, login, register, verifyEmail, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
