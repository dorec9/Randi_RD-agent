import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute() {
  const { isAuthed, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // 로딩 화면 넣고 싶으면 여기서 렌더
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
