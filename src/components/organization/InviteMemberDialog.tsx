import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgProvider";
import { useTenant } from "@/context/TenantProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Copy, UserPlus } from "lucide-react";

export function InviteMemberDialog() {
  const { activeOrg } = useOrg();
  const { primaryDomain, tenantSlug } = useTenant();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);

  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const generateInviteLink = (token: string): string => {
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.includes('lovableproject.com');
    
    if (isDev) {
      // Development: use /t/{slug} pattern
      return `${window.location.origin}/t/${tenantSlug}/auth/accept-invite?token=${token}`;
    } else if (primaryDomain) {
      // Production: use tenant's primary domain
      return `https://${primaryDomain}/auth/accept-invite?token=${token}`;
    } else {
      // Fallback
      return `${window.location.origin}/auth/accept-invite?token=${token}`;
    }
  };

  const handleInvite = async () => {
    if (!activeOrg || !email) return;

    setLoading(true);
    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from("organization_invites")
        .insert({
          org_id: activeOrg.id,
          email: email.toLowerCase().trim(),
          role,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      const link = generateInviteLink(token);
      setInviteLink(link);
      
      toast({
        title: "Invite created",
        description: "Copy the invite link below and send it to the user.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Copied",
      description: "Invite link copied to clipboard",
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setRole("viewer");
    setInviteLink("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member to {activeOrg?.name}</DialogTitle>
        </DialogHeader>
        
        {!inviteLink ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleInvite} disabled={!email || loading} className="w-full">
              {loading ? "Creating..." : "Create Invite"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with the user. It will expire in 7 days.
            </p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly />
              <Button onClick={handleCopyLink} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleClose} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
