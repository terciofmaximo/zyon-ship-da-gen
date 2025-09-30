import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Copy, 
  QrCode, 
  Trash2, 
  Clock, 
  Mail,
  Shield,
  Eye,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/context/CompanyProvider";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";

const inviteSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  role: z.enum(["admin", "member", "viewer"]),
});

type Member = {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
  user_email?: string;
};

type Invitation = {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'owner': return <Shield className="h-4 w-4 text-amber-600" />;
    case 'admin': return <Settings className="h-4 w-4 text-blue-600" />;
    case 'member': return <Users className="h-4 w-4 text-green-600" />;
    case 'viewer': return <Eye className="h-4 w-4 text-gray-600" />;
    default: return <Users className="h-4 w-4" />;
  }
};

const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (role) {
    case 'owner': return "default";
    case 'admin': return "secondary";
    case 'member': return "outline";
    case 'viewer': return "outline";
    default: return "outline";
  }
};

export function TeamManagement() {
  const { toast } = useToast();
  const { activeCompanyId } = useCompany();
  const { canManageTeam, activeCompany, userRole, requirePermission } = usePermissions();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [errors, setErrors] = useState<{ email?: string; role?: string }>({});
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string>("");

  useEffect(() => {
    if (activeCompanyId && canManageTeam) {
      loadMembers();
      loadInvitations();
    }
  }, [activeCompanyId, canManageTeam]);

  const loadMembers = async () => {
    if (!activeCompanyId) return;

    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq("company_id", activeCompanyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For simplicity, just show user IDs. In production, you'd fetch user emails
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadInvitations = async () => {
    if (!activeCompanyId) return;

    setLoadingInvitations(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("company_id", activeCompanyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      });
      setInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const generateSecureToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      requirePermission("manage_team");
    } catch (error: any) {
      toast({
        title: "Permission Denied",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (!activeCompanyId) return;

    setErrors({});

    // Validate input
    const validation = inviteSchema.safeParse({ email, role });
    if (!validation.success) {
      const fieldErrors: any = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setCreating(true);
    try {
      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from("invitations")
        .select("id")
        .eq("company_id", activeCompanyId)
        .eq("email", validation.data.email)
        .eq("status", "pending");

      if (existingInvitation && existingInvitation.length > 0) {
        toast({
          title: "Error",
          description: "An invitation is already pending for this email",
          variant: "destructive",
        });
        return;
      }

      // Generate secure token and expiration
      const token = generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      // Create invitation
      const { data: invitation, error } = await supabase
        .from("invitations")
        .insert({
          company_id: activeCompanyId,
          email: validation.data.email,
          role: validation.data.role,
          token,
          expires_at: expiresAt.toISOString(),
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      // Generate invite link
      const baseUrl = import.meta.env.VITE_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
      const inviteLink = `${baseUrl}/invite/accept?token=${token}`;
      setGeneratedInviteLink(inviteLink);

      toast({
        title: "Success",
        description: `Invitation created for ${validation.data.email}`,
      });

      // Reset form
      setEmail("");
      setRole("member");
      
      // Reload invitations
      await loadInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    try {
      requirePermission("manage_team");
    } catch (error: any) {
      toast({
        title: "Permission Denied",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "revoked" })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation revoked",
      });

      await loadInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = async (token: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
    const inviteLink = `${baseUrl}/invite/accept?token=${token}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  if (!activeCompanyId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            {!activeCompanyId 
              ? "No company selected" 
              : !canManageTeam
                ? `You don't have permission to manage this team. Current role: ${userRole || 'none'}`
                : "Access denied"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage team members and invitations for {activeCompany?.name}
              </CardDescription>
            </div>
            {canManageTeam && (
              <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation link to join {activeCompany?.name}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={createInvitation} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="member@company.com"
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Role</Label>
                      <Select value={role} onValueChange={(value: any) => setRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Viewer - Read only access
                            </div>
                          </SelectItem>
                          <SelectItem value="member">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Member - Standard access
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Admin - Full access
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="text-sm text-destructive">{errors.role}</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={creating} className="flex-1">
                        {creating ? "Creating..." : "Create Invitation"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowInviteModal(false);
                          setEmail("");
                          setRole("member");
                          setErrors({});
                          setGeneratedInviteLink("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>

                  {generatedInviteLink && (
                    <div className="mt-6 space-y-4 border-t pt-4">
                      <div>
                        <Label>Invitation Link</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={generatedInviteLink}
                            readOnly
                            className="text-xs"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyInviteLink(generatedInviteLink.split('token=')[1])}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>QR Code</Label>
                        <div className="flex justify-center mt-2 p-4 bg-white rounded-lg">
                          <QRCodeSVG value={generatedInviteLink} size={120} />
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members" className="space-y-4">
            <TabsList>
              <TabsTrigger value="members">
                <Users className="h-4 w-4 mr-2" />
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                <Mail className="h-4 w-4 mr-2" />
                Pending Invitations ({invitations.filter(i => i.status === 'pending').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              {loadingMembers ? (
                <p className="text-center py-8 text-muted-foreground">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No members found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      {canManageTeam && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              {getRoleIcon(member.role)}
                            </div>
                            <div>
                              <div className="font-medium">{member.user_email || 'User'}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {member.user_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleVariant(member.role)} className="capitalize">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        {canManageTeam && (
                          <TableCell className="text-right">
                            {member.role !== 'owner' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  // TODO: Implement remove member functionality
                                  toast({
                                    title: "Feature Coming Soon",
                                    description: "Member removal functionality will be implemented soon",
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="invitations">
              {loadingInvitations ? (
                <p className="text-center py-8 text-muted-foreground">Loading invitations...</p>
              ) : invitations.filter(i => i.status === 'pending').length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No pending invitations</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.filter(i => i.status === 'pending').map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          {invitation.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {invitation.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {canManageTeam && (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyInviteLink(invitation.token)}
                                title="Copy invite link"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Show QR code">
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-sm">
                                  <DialogHeader>
                                    <DialogTitle>Invitation QR Code</DialogTitle>
                                    <DialogDescription>
                                      Scan this QR code to accept the invitation
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-center py-4">
                                    <div className="p-4 bg-white rounded-lg">
                                       <QRCodeSVG 
                                        value={`${import.meta.env.VITE_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')}/invite/accept?token=${invitation.token}`} 
                                        size={200} 
                                      />
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Revoke invitation">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to revoke the invitation for {invitation.email}?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => revokeInvitation(invitation.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Revoke
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}