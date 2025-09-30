import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";

export function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  // Redirect authenticated users to dashboard, others to public PDA form
  return <Navigate to={user ? "/dashboard" : "/pda/new"} replace />;
}
