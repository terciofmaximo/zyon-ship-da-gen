import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6"><Skeleton className="h-10 w-48" /><div className="mt-4 space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-5/6" /><Skeleton className="h-6 w-2/3" /></div></div>;
  }

  if (!user) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?from=${from}`} replace />;
  }

  return <>{children}</>;
};
