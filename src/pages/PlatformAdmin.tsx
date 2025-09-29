import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Shield, UserPlus, Copy, CheckCircle2, Key } from "lucide-react";
import { useSeedPlatformAdmin } from "@/hooks/useSeedPlatformAdmin";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default function PlatformAdmin() {
  const { isPlatformAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const { seedAdmin, loading: seedLoading } = useSeedPlatformAdmin();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [email, setEmail] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [role, setRole] = useState("ops");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleSeedAdmin = async () => {
    try {
      console.log('Calling seed-platform-admin edge function...');
      const result = await seedAdmin();
      console.log('Seed result:', result);
      
      toast({
        title: "Success",
        description: "Platform admin seeded. You can now log in with contact@vesselopsportal.com",
      });
    } catch (error) {
      console.error("Error seeding admin:", error);
      toast({
        title: "Error",
        description: "Failed to seed platform admin. Check console for details.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchOrganizations();
    }
  }, [isPlatformAdmin]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .order("name");

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedOrgId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setInviteLink(null);

    try {
      // Check if user exists by email
      const { data, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      const existingUser = data?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        // User exists - add to organization_members
        const { error: memberError } = await supabase
          .from("organization_members")
          .insert({
            org_id: selectedOrgId,
            user_id: existingUser.id,
            role: role,
          });

        if (memberError) {
          if (memberError.code === "23505") {
            toast({
              title: "Already a member",
              description: "This user is already a member of this organization",
              variant: "destructive",
            });
          } else {
            throw memberError;
          }
          return;
        }

        toast({
          title: "Member added",
          description: `${email} has been added to the organization as ${role}`,
        });

        // Reset form
        setEmail("");
        setRole("ops");
      } else {
        // User doesn't exist - create invite
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const { error: inviteError } = await supabase
          .from("organization_invites")
          .insert({
            org_id: selectedOrgId,
            email: email.toLowerCase(),
            role: role,
            token: token,
            expires_at: expiresAt.toISOString(),
          });

        if (inviteError) {
          if (inviteError.code === "23505") {
            toast({
              title: "Invite already exists",
              description: "An invite for this email already exists",
              variant: "destructive",
            });
          } else {
            throw inviteError;
          }
          return;
        }

        const link = `${window.location.origin}/invite?token=${token}`;
        setInviteLink(link);

        toast({
          title: "Invite created",
          description: "User doesn't exist yet. Invite link generated.",
        });
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description: "Failed to add member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Copied",
        description: "Invite link copied to clipboard",
      });
    }
  };

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Admin</h1>
            <p className="text-muted-foreground">
              Manage users and organization memberships
            </p>
          </div>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              System Management
            </CardTitle>
            <CardDescription>
              Initialize platform admin account for development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Platform Admin Credentials:</p>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> contact@vesselopsportal.com</p>
                  <p><strong>Password:</strong> Admin123!</p>
                </div>
              </div>
              <Button 
                onClick={handleSeedAdmin} 
                disabled={seedLoading}
                variant="outline"
                className="w-full"
              >
                {seedLoading ? "Seeding..." : "Seed Platform Admin User"}
              </Button>
              <p className="text-xs text-muted-foreground">
                This creates/updates the platform admin account with email confirmation bypassed.
                Use for development only.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add User to Organization
            </CardTitle>
            <CardDescription>
              Add an existing user or create an invite for a new user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId} required>
                  <SelectTrigger id="organization">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} ({org.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="ops">Operations</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Processing..." : "Add Member"}
              </Button>
            </form>

            {inviteLink && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-green-900">Invite link created</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={inviteLink}
                        readOnly
                        className="bg-white text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={copyInviteLink}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-green-700">
                      Send this link to the user to complete their registration
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
