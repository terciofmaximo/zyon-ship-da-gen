import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX, Eye, Users, Settings, Crown } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export function PermissionDenied({ 
  requiredPermission, 
  message 
}: { 
  requiredPermission?: string;
  message?: string;
}) {
  const { userRole, activeCompany } = usePermissions();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-amber-600" />;
      case 'admin': return <Settings className="h-4 w-4 text-blue-600" />;
      case 'member': return <Users className="h-4 w-4 text-green-600" />;
      case 'viewer': return <Eye className="h-4 w-4 text-gray-600" />;
      default: return <ShieldX className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
        <CardTitle className="text-destructive">Access Denied</CardTitle>
        <CardDescription>
          You don't have sufficient permissions to access this feature
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Your Role:</span>
            <div className="flex items-center gap-2">
              {getRoleIcon(userRole || '')}
              <span className="text-sm capitalize">{userRole || 'None'}</span>
            </div>
          </div>
          
          {activeCompany && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Company:</span>
              <span className="text-sm">{activeCompany.name}</span>
            </div>
          )}
          
          {requiredPermission && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Required:</span>
              <span className="text-sm">{requiredPermission}</span>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Contact your organization administrator if you believe this is incorrect.
        </div>
      </CardContent>
    </Card>
  );
}