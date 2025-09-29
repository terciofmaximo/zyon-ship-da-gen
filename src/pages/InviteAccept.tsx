import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    validateAndFetchInvite(token);
  }, [searchParams]);

  useEffect(() => {
    if (user && invite) {
      acceptInvite();
    }
  }, [user, invite]);

  const validateAndFetchInvite = async (token: string) => {
    try {
      // Use secure RPC function to get invite by token
      const { data, error } = await supabase.rpc("get_invite_by_token", {
        invite_token: token,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Invite not found");
      }

      const inviteData = data[0];

      // Check if already accepted
      if (inviteData.accepted_at) {
        setError("This invite has already been used");
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError("This invite has expired");
        setLoading(false);
        return;
      }

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", inviteData.org_id)
        .single();

      if (orgError) throw orgError;

      // Combine invite and org data
      setInvite({
        ...inviteData,
        organizations: orgData,
      });
      setLoading(false);
    } catch (error: any) {
      setError("Invalid or expired invite");
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!user || !invite) return;

    setLoading(true);
    try {
      // Check if user already has membership
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("*")
        .eq("org_id", invite.org_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: `You're already a member of ${invite.organizations.name}`,
        });
      } else {
        // Add user to organization
        const { error: memberError } = await supabase
          .from("organization_members")
          .insert({
            org_id: invite.org_id,
            user_id: user.id,
            role: invite.role,
          });

        if (memberError) throw memberError;
      }

      // Mark invite as accepted
      const { error: updateError } = await supabase
        .from("organization_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

      if (updateError) throw updateError;

      // Set active org and redirect
      localStorage.setItem("active_org_id", invite.org_id);
      
      toast({
        title: "Invite accepted",
        description: `You've joined ${invite.organizations.name}`,
      });

      // Reload to update org context
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Organization Invite</CardTitle>
            <CardDescription>
              You've been invited to join {invite?.organizations?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Role: <span className="font-medium">{invite?.role}</span>
            </p>
            <Button onClick={() => navigate(`/auth?from=${encodeURIComponent(`/invite?token=${searchParams.get("token")}`)}`)} className="w-full">
              Sign In to Accept
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
