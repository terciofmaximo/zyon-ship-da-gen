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

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    const isPublic = isPublicRoute(currentPath);

    // If route is not public and user is not authenticated, redirect to login
    if (!isPublic && !user) {
      console.log(`RouteGuard: Redirecting to /auth from ${currentPath} (not authenticated)`);
      navigate("/auth", { state: { from: currentPath }, replace: true });
    }
  }, [user, loading, currentPath, navigate]);

  // Show loading skeleton while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // If not public and not authenticated, don't render (redirect will happen)
  if (!isPublicRoute(currentPath) && !user) {
    return null;
  }

  return <>{children}</>;
}
