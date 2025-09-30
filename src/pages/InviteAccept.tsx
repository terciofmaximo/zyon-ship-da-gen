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
      // Use secure RPC function to validate and get invite by token
      const { data, error } = await supabase.rpc("validate_invite_token", {
        invite_token: token,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Invite not found, expired, or already used");
      }

      const inviteData = data[0];

      // The new function already validates expiry and acceptance status
      // So if we get here, the invite is valid
      setInvite({
        ...inviteData,
        organizations: {
          id: inviteData.org_id,
          name: inviteData.org_name,
        },
      });
      setLoading(false);
    } catch (error: any) {
      if (error.message.includes('expired')) {
        setError("Este convite expirou. Solicite um novo convite ao administrador.");
      } else if (error.message.includes('already used')) {
        setError("Este convite já foi utilizado. Caso precise de acesso, solicite um novo convite.");
      } else {
        setError("Convite inválido, expirado ou já utilizado");
      }
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
          title: "Já é membro",
          description: `Você já é membro da ${invite.organizations.name}`,
        });
        window.location.href = "/";
        return;
      } else {
        // Add user to organization with upsert logic
        const { error: memberError } = await supabase
          .from("organization_members")
          .upsert({
            org_id: invite.org_id,
            user_id: user.id,
            role: invite.role,
          }, {
            onConflict: 'org_id,user_id'
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
        title: "Bem-vindo!",
        description: `Você ingressou na ${invite.organizations.name} como ${invite.role}`,
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
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Ir para Dashboard
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
            <CardTitle>Convite para Organização</CardTitle>
            <CardDescription>
              Você foi convidado para ingressar na {invite?.organizations?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Função: <span className="font-medium">{invite?.role}</span>
            </p>
            <Button onClick={() => navigate(`/auth?from=${encodeURIComponent(`/invite?token=${searchParams.get("token")}`)}`)} className="w-full">
              Entrar para Aceitar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
