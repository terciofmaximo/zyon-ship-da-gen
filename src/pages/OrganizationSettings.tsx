import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrg } from "@/context/OrgProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { DomainManagement } from "@/components/organization/DomainManagement";
import { CompanyManagement } from "@/components/organization/CompanyManagement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users, Globe, Shield, UserPlus, Trash2, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { InviteMemberDialog } from "@/components/organization/InviteMemberDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Member = {
  user_id: string;
  role: string;
  created_at: string;
};

export default function OrganizationSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const { isPlatformAdmin } = useUserRole();
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  // Default to 'companies' tab if platformAdmin with no active org
  const defaultTab = isPlatformAdmin && !activeOrg ? "companies" : "organization";
  const activeTab = searchParams.get("tab") || defaultTab;

  const isViewer = activeOrg && activeOrg.role === "viewer";
  const canEdit = isPlatformAdmin || (activeOrg && ['admin', 'owner'].includes(activeOrg.role));

  useEffect(() => {
    if (activeOrg) {
      setOrgName(activeOrg.name);
      setOrgSlug(activeOrg.slug);
    }
  }, [activeOrg]);

  useEffect(() => {
    if (activeOrg && activeTab === "people") {
      loadMembers();
    }
  }, [activeOrg, activeTab]);

  const loadMembers = async () => {
    if (!activeOrg) return;

    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("user_id, role, created_at")
        .eq("org_id", activeOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!activeOrg || !canEdit) return;

    setSavingOrg(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: orgName,
          slug: orgSlug,
        })
        .eq("id", activeOrg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingOrg(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeOrg || !canEdit) return;

    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("org_id", activeOrg.id)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      
      loadMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Allow platformAdmin to access settings without an active org
  if (!activeOrg && !isPlatformAdmin) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No organization selected</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            {isPlatformAdmin && !activeOrg 
              ? "Platform administration and company management"
              : "Manage your organization configuration, members, and domains"
            }
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(tab) => setSearchParams({ tab })}>
          <TabsList>
            {activeOrg && (
              <>
                <TabsTrigger value="organization">
                  <Building2 className="h-4 w-4 mr-2" />
                  Organization
                </TabsTrigger>
                <TabsTrigger value="people">
                  <Users className="h-4 w-4 mr-2" />
                  People
                </TabsTrigger>
                <TabsTrigger value="domains">
                  <Globe className="h-4 w-4 mr-2" />
                  Domains
                </TabsTrigger>
              </>
            )}
            {isPlatformAdmin && (
              <TabsTrigger value="companies">
                <Building className="h-4 w-4 mr-2" />
                Companies
              </TabsTrigger>
            )}
          </TabsList>

          {activeOrg && (
            <TabsContent value="organization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>
                  {canEdit ? "Manage your organization information" : "View organization information"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-slug">Organization Slug</Label>
                  <Input
                    id="org-slug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-id">Organization ID</Label>
                  <Input
                    id="org-id"
                    value={activeOrg.id}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    This ID is read-only and cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Your Role</Label>
                  <div>
                    <Badge variant="outline" className="capitalize">
                      {activeOrg.role}
                    </Badge>
                  </div>
                </div>

                {canEdit && (
                  <Button
                    onClick={handleSaveOrganization}
                    disabled={savingOrg || (orgName === activeOrg.name && orgSlug === activeOrg.slug)}
                  >
                    {savingOrg ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {isPlatformAdmin && (
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Platform Administration</CardTitle>
                      <CardDescription>
                        Access platform-wide administrative tools
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/platform-admin")}
                  >
                    Open Platform Admin
                  </Button>
                </CardContent>
              </Card>
            )}
            </TabsContent>
          )}

          {activeOrg && (
            <TabsContent value="people" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                      {canEdit ? "Manage organization members and their roles" : "View organization members"}
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <InviteMemberDialog />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Loading members...
                  </p>
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members found
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        {canEdit && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.user_id}>
                          <TableCell className="font-mono text-xs">{member.user_id}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(member.created_at).toLocaleDateString()}
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove this member from the organization?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveMember(member.user_id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          )}

          {activeOrg && (
            <TabsContent value="domains" className="space-y-4">
            {canEdit ? (
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
            </TabsContent>
          )}

          {isPlatformAdmin && (
            <TabsContent value="companies" className="space-y-4">
              <CompanyManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
