import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show skeleton while checking auth - prevents flash of private content
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

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Block access if email is not verified (except for demo admin)
  const isDemoAdmin = user.email === 'admin@zyon.com' || user.email === 'contato@vesselopsportal.com';
  if (!user.email_confirmed_at && !isDemoAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu email ainda não foi verificado. Por favor, verifique sua caixa de entrada e clique no link de confirmação.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/auth/verify-email'}
              className="flex-1"
            >
              Reenviar Email
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                // Clear session and redirect to auth
                window.location.href = '/auth';
              }}
              className="flex-1"
            >
              Fazer Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
