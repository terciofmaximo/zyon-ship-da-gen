import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { isPublicRoute } from "@/config/publicRoutes";
import { Skeleton } from "@/components/ui/skeleton";

interface RouteGuardProps {
  children: ReactNode;
}

/**
 * Central route guard that redirects unauthenticated users to /auth
 * Only allows access to PUBLIC_ROUTES without authentication
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isPublic = isPublicRoute(currentPath);

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // If route is not public and user is not authenticated, redirect to login
    if (!isPublic && !user) {
      console.log(`RouteGuard: Redirecting to /auth from ${currentPath} (not authenticated)`);
      navigate("/auth", { state: { from: currentPath }, replace: true });
    }
  }, [user, loading, currentPath, isPublic, navigate]);

  // Show loading skeleton while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // CRITICAL: If not public and not authenticated, show nothing (redirect will happen)
  // This prevents flash of private content before redirect
  if (!isPublic && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
