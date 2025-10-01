import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { Loading } from "@/components/ui/loading";

export function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading variant="default" />;
  }

  // Redirect authenticated users to dashboard, others to login
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}
