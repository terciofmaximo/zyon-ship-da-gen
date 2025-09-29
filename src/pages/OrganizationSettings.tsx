import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrg } from "@/context/OrgProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { DomainManagement } from "@/components/organization/DomainManagement";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

export default function OrganizationSettings() {
  const { activeOrg } = useOrg();
  const { isPlatformAdmin } = useUserRole();

  const canManageDomains = activeOrg && (
    ['admin', 'owner'].includes(activeOrg.role) || isPlatformAdmin
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization configuration and access
          </p>
        </div>

        {activeOrg && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{activeOrg.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {activeOrg.slug}
                      <Badge variant="outline" className="capitalize">
                        {activeOrg.role}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {canManageDomains ? (
          <DomainManagement />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Only organization administrators can manage domain settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
