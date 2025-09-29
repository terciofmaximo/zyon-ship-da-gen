import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Link as LinkIcon, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

export default function NoOrganization() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPlatformAdmin, loading: roleLoading } = useUserRole();
  const [inviteToken, setInviteToken] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect platformAdmin to dashboard
  useEffect(() => {
    if (!roleLoading && isPlatformAdmin) {
      navigate("/", { replace: true });
    }
  }, [isPlatformAdmin, roleLoading, navigate]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Extract token from full URL or use as-is
      let token = inviteToken.trim();
      if (token.includes("token=")) {
        const url = new URL(token);
        token = url.searchParams.get("token") || "";
      }

      if (!token) {
        toast({
          title: "Invalid invite link",
          description: "Please provide a valid invite link or token",
          variant: "destructive",
        });
        return;
      }

      // Navigate to invite acceptance page
      navigate(`/invite?token=${token}`);
    } catch (error) {
      toast({
        title: "Invalid invite link",
        description: "Please check the link and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    toast({
      title: "Request access",
      description: `Please contact your administrator with your email: ${user?.email}`,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>No Organization</CardTitle>
          <CardDescription>
            You're not a member of any organization yet. Choose an option below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Option A: Enter invite link */}
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteToken" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Enter Invite Link
              </Label>
              <Input
                id="inviteToken"
                type="text"
                placeholder="Paste invite link or token here"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              Join with Invite
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Option B: Request access */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRequestAccess}
          >
            <Mail className="w-4 h-4 mr-2" />
            Request Access
          </Button>

          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
