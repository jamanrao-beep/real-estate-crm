"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

export type Role = "ADMIN" | "SALES_PERSON";

export interface User {
  id: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for token and user in localStorage on mount
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    
    // Redirect based on role
    if (newUser.role === "ADMIN") {
      router.push("/admin/leads/unassigned");
    } else {
      router.push("/sales/leads");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Route protection logic
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = pathname?.startsWith("/login");
    const isAdminRoute = pathname?.startsWith("/admin");
    const isSalesRoute = pathname?.startsWith("/sales");

    if (!user && !isAuthRoute) {
      // Not logged in, redirect to login
      router.push("/login");
    } else if (user && isAuthRoute) {
      // Logged in but on login page, redirect to correct dashboard
      if (user.role === "ADMIN") {
        router.push("/admin/leads/unassigned");
      } else {
        router.push("/sales/leads");
      }
    } else if (user && isAdminRoute && user.role !== "ADMIN") {
      // Unauthorized role trying to access admin
      router.push("/sales/leads");
    } else if (user && isSalesRoute && user.role !== "SALES_PERSON") {
       // Unauthorized role trying to access sales
       router.push("/admin/leads/unassigned");
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
