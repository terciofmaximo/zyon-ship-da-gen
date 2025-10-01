import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { isPublicRoute } from "@/config/publicRoutes";
import { Loading } from "@/components/ui/loading";

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

  // Show loading while checking auth
  if (loading) {
    return <Loading variant="default" />;
  }

  // CRITICAL: If not public and not authenticated, show loading (redirect will happen)
  // This prevents flash of private content before redirect
  if (!isPublic && !user) {
    return <Loading variant="default" />;
  }

  return <>{children}</>;
}
