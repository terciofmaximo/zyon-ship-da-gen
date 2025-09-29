import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const token = searchParams.get("token");

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      toast({
        title: "Invalid invitation",
        description: "No invitation token provided",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_invite_by_token', { invite_token: token });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Invalid invitation",
          description: "This invitation link is invalid or has expired",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const invite = data[0];

      // Check if already accepted
      if (invite.accepted_at) {
        toast({
          title: "Invitation already used",
          description: "This invitation has already been accepted",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        toast({
          title: "Invitation expired",
          description: "This invitation has expired. Please request a new one.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Fetch organization name
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', invite.org_id)
        .single();

      setEmail(invite.email);
      setOrgName(orgData?.name || "");
      setInviteValid(true);
    } catch (error: any) {
      console.error('Error validating token:', error);
      toast({
        title: "Error",
        description: "Failed to validate invitation",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setErrors({ password: passwordValidation.error.issues[0].message });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Check if user exists
      const { data: existingUser } = await supabase.auth.getUser();
      
      let userId: string;

      if (existingUser?.user) {
        // User exists, update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });
        
        if (updateError) throw updateError;
        userId = existingUser.user.id;
      } else {
        // Create new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("Failed to create user");
        
        userId = signUpData.user.id;
      }

      // Get invite details
      const { data: inviteData } = await supabase
        .rpc('get_invite_by_token', { invite_token: token! });
      
      if (!inviteData || inviteData.length === 0) {
        throw new Error("Invite not found");
      }

      const invite = inviteData[0];

      // Update user profile
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          tenant_id: invite.org_id,
          must_reset_password: false,
          invited_at: new Date().toISOString(),
        });

      // Add user to organization
      await supabase
        .from('organization_members')
        .insert({
          org_id: invite.org_id,
          user_id: userId,
          role: invite.role,
        });

      // Mark invite as accepted
      await supabase
        .from('organization_invites')
        .update({
          accepted_at: new Date().toISOString(),
          used_at: new Date().toISOString(),
        })
        .eq('token', token!);

      // Update organization owner if this is the first owner
      const { data: orgData } = await supabase
        .from('organizations')
        .select('owner_user_id')
        .eq('id', invite.org_id)
        .single();

      if (!orgData?.owner_user_id && invite.role === 'owner') {
        await supabase
          .from('organizations')
          .update({ owner_user_id: userId })
          .eq('id', invite.org_id);
      }

      toast({
        title: "Welcome!",
        description: "Your account has been activated successfully",
      });

      // Sign in the user
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Redirect to tenant dashboard
      navigate('/');
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!inviteValid) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Your Password</CardTitle>
          <CardDescription>
            Welcome to {orgName || "Vessel Ops Portal"}! Set your password to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up your account...
                </>
              ) : (
                "Activate Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
