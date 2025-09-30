import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Clock, Building2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthProvider";
import { useCompany } from "@/context/CompanyProvider";
import { useToast } from "@/hooks/use-toast";

type InvitationData = {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  company_id: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  organizations: {
    name: string;
    slug: string;
  };
};

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveCompanyId, refetch: refetchCompanies } = useCompany();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string>("");
  const [forceAccept, setForceAccept] = useState(false);
  const [canForceAccept, setCanForceAccept] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link - missing token");
      setLoading(false);
      return;
    }

    if (!user) {
      // Redirect to login with callback
      const callbackUrl = encodeURIComponent(`/invite/accept?token=${token}`);
      navigate(`/auth?callback=${callbackUrl}`);
      return;
    }

    loadInvitation();
  }, [token, user]);

  const loadInvitation = async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("invitations")
        .select(`
          id,
          email,
          role,
          company_id,
          status,
          expires_at,
          organizations!inner (
            name,
            slug
          )
        `)
        .eq("token", token)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError("Invitation not found or invalid token");
        } else {
          throw fetchError;
        }
        return;
      }

      const invitation = data as InvitationData;
      
      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        setError("This invitation has expired");
        return;
      }

      // Check invitation status
      if (invitation.status !== 'pending') {
        switch (invitation.status) {
          case 'accepted':
            setError("This invitation has already been accepted");
            break;
          case 'revoked':
            setError("This invitation has been revoked");
            break;
          case 'expired':
            setError("This invitation has expired");
            break;
          default:
            setError("This invitation is no longer valid");
        }
        return;
      }

      setInvitation(invitation);

      // Check if user can force accept (if email doesn't match)
      if (user && invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
        await checkForceAcceptPermission(invitation.company_id);
      }
    } catch (error: any) {
      console.error("Error loading invitation:", error);
      setError("Failed to load invitation details");
    } finally {
      setLoading(false);
    }
  };

  const checkForceAcceptPermission = async (companyId: string) => {
    if (!user) return;

    try {
      // Check if user is platform admin
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "platformAdmin");

      if (userRoles && userRoles.length > 0) {
        setCanForceAccept(true);
        return;
      }

      // Check if user is owner of the company
      const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .eq("role", "owner");

      if (membership && membership.length > 0) {
        setCanForceAccept(true);
      }
    } catch (error) {
      console.error("Error checking force accept permission:", error);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !user) return;

    // Check email match unless forcing
    if (!forceAccept && invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      setError(`This invitation is for ${invitation.email}, but you are logged in as ${user.email}`);
      return;
    }

    setAccepting(true);
    setError("");

    try {
      // Start transaction-like operations
      // 1. Check if membership already exists
      const { data: existingMembership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", invitation.company_id)
        .single();

      // 2. Create membership if it doesn't exist
      if (!existingMembership) {
        const { error: membershipError } = await supabase
          .from("memberships")
          .insert({
            user_id: user.id,
            company_id: invitation.company_id,
            role: invitation.role
          });

        if (membershipError) {
          throw membershipError;
        }
      } else {
        // Update existing membership role if needed
        const { error: updateError } = await supabase
          .from("memberships")
          .update({ role: invitation.role })
          .eq("id", existingMembership.id);

        if (updateError) {
          throw updateError;
        }
      }

      // 3. Mark invitation as accepted
      const { error: invitationError } = await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      if (invitationError) {
        throw invitationError;
      }

      // 4. Set active company and refresh company list
      setActiveCompanyId(invitation.company_id);
      await refetchCompanies();

      toast({
        title: "Success!",
        description: `Welcome to ${invitation.organizations.name}! You are now a ${invitation.role}.`,
      });

      // 5. Redirect to dashboard
      navigate("/");
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      setError("Failed to accept invitation. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-center mt-4 text-muted-foreground">
              Loading invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No invitation found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailMismatch = user && invitation.email.toLowerCase() !== user.email?.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Join {invitation.organizations.name}</CardTitle>
          <CardDescription>
            You've been invited to join as a {invitation.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Company:</span>
              <span className="text-sm">{invitation.organizations.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Role:</span>
              <span className="text-sm capitalize flex items-center gap-2">
                <Users className="h-4 w-4" />
                {invitation.role}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Invited Email:</span>
              <span className="text-sm">{invitation.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Expires:</span>
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(invitation.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Email Mismatch Warning */}
          {emailMismatch && (
            <Alert>
              <AlertDescription>
                This invitation is for <strong>{invitation.email}</strong>, but you are logged in as <strong>{user?.email}</strong>.
                {canForceAccept && (
                  <div className="mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={forceAccept}
                        onChange={(e) => setForceAccept(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Accept anyway (Admin override)</span>
                    </label>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={acceptInvitation}
              disabled={accepting || (emailMismatch && !forceAccept && !canForceAccept)}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          {/* Current User Info */}
          {user && (
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              Logged in as: <strong>{user.email}</strong>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
