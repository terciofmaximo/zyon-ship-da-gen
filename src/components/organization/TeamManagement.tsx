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
  Settings,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/context/CompanyProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { useInvitationCleanup } from "@/hooks/useInvitationCleanup";
import { useTeamService } from "@/hooks/useTeamService";
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

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "pending": return "secondary";
    case "accepted": return "default";
    case "revoked": return "destructive";
    case "expired": return "outline";
    default: return "outline";
  }
};

const getDaysRemaining = (expiresAt: string) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getInvitationStatus = (invitation: Invitation) => {
  if (invitation.status === 'revoked') return 'revoked';
  if (invitation.status === 'accepted') return 'accepted';
  
  const daysRemaining = getDaysRemaining(invitation.expires_at);
  if (daysRemaining <= 0) return 'expired';
  
  return 'pending';
};

export function TeamManagement() {
  const { toast } = useToast();
  const { activeCompanyId } = useCompany();
  const { canManageTeam, activeCompany, userRole, requirePermission } = usePermissions();
  const { manualExpireInvitations } = useInvitationCleanup();
  const teamService = useTeamService();
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
    const result = await teamService.fetchMembers(activeCompanyId);
    setMembers(result.data);
    setLoadingMembers(false);
  };

  const loadInvitations = async () => {
    if (!activeCompanyId) return;

    setLoadingInvitations(true);
    const result = await teamService.fetchInvitations(activeCompanyId);
    setInvitations(result.data);
    setLoadingInvitations(false);
  };

  // Invitation functionality disabled - no longer supported
  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Invitations Disabled",
      description: "The invitation system has been disabled. Please contact your administrator.",
      variant: "destructive",
    });
  };

  const promoteUser = async (memberId: string, currentRole: string) => {
    try {
      requirePermission('manage_team');
      
      const newRole = currentRole === 'viewer' ? 'member' : 
                     currentRole === 'member' ? 'admin' : 'admin';
      
      const { error } = await supabase
        .from("memberships")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User promoted to ${newRole}`,
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

  const demoteUser = async (memberId: string, currentRole: string) => {
    try {
      requirePermission('manage_team');
      
      const newRole = currentRole === 'admin' ? 'member' : 
                     currentRole === 'member' ? 'viewer' : 'viewer';
      
      const { error } = await supabase
        .from("memberships")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User demoted to ${newRole}`,
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

    const result = await teamService.revokeInvitation(invitationId);
    if (result.success) {
      await loadInvitations();
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
              <div className="text-sm text-muted-foreground">
                {/* Invitation system disabled */}
              </div>
            )}
            {false && canManageTeam && (
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
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleVariant(member.role)} className="capitalize">
                              {member.role}
                            </Badge>
                            {canManageTeam && member.role !== 'owner' && (
                              <div className="flex gap-1">
                                {member.role !== 'admin' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => promoteUser(member.id, member.role)}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                )}
                                {member.role !== 'viewer' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => demoteUser(member.id, member.role)}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
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
                    {invitations.map((invitation) => (
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
                           <div className="flex items-center gap-2">
                             <Badge variant={getStatusBadgeVariant(getInvitationStatus(invitation))}>
                               {getInvitationStatus(invitation)}
                             </Badge>
                             {getInvitationStatus(invitation) === 'pending' && (
                               <span className="text-xs text-muted-foreground">
                                 D-{getDaysRemaining(invitation.expires_at)}
                               </span>
                             )}
                           </div>
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