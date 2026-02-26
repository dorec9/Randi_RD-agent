import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import http from "../api/http";

type UserMe = {
  userId: number;
  email: string;
  name: string;
  department: string;
  position: string;
  role: "MASTER" | "ADMIN" | "MEMBER";
  companyId: number;
  companyName: string;
  planId: number;
  planName: string;
  planPrice: number;
  isDownloadable: boolean;
  parentId: number | null;
  parentEmail: string | null;
  createdAt: string;
};

type AuthState = {
  me: UserMe | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthed: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  const didInit = useRef(false);
  const logout = async () => {
    const token = localStorage.getItem("accessToken");

    try {
        // 토큰이 있을 때만 백 로그아웃 호출
    if (token) {
        await http.post("/api/logout"); // Authorization은 http 인터셉터가 자동으로 붙임
        }
    } catch (e) {
        // 백 호출 실패해도 프론트는 강제 로그아웃 처리
    } finally {
        localStorage.removeItem("accessToken");
        setMe(null);
    }
  };


  const refreshMe = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMe(null);
      return;
    }

    try {
      const res = await http.get<UserMe>("/api/users/me");
      setMe(res.data);
    } catch {
      logout();
    }
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      try {
        await refreshMe();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ me, loading, refreshMe, logout, isAuthed: !!me }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
