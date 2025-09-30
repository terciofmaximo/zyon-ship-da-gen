import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndSetup = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          setError("Sessão não encontrada. Por favor, faça login.");
          setLoading(false);
          return;
        }

        // Check if user has organization
        const { data: orgMembers, error: orgError } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", session.user.id)
          .limit(1);

        if (orgError) throw orgError;

        if (!orgMembers || orgMembers.length === 0) {
          // Trigger manual association if not done yet
          const { error: assocError } = await supabase.rpc("auto_associate_organization_by_domain", {
            p_user_id: session.user.id,
            p_email: session.user.email,
            p_company_name: session.user.user_metadata.company_name,
            p_cnpj: session.user.user_metadata.cnpj,
            p_company_type: session.user.user_metadata.company_type,
            p_session_id: session.user.user_metadata.session_id,
          });

          if (assocError) {
            console.error("Association error:", assocError);
          }
        }

        // Redirect after a short delay
        setTimeout(() => {
          const returnUrl = searchParams.get("returnUrl") || "/dashboard";
          navigate(returnUrl);
        }, 2000);

      } catch (error: any) {
        console.error("Verification error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    verifyAndSetup();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Configurando sua conta...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Erro na Confirmação</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle>Email Confirmado!</CardTitle>
          <CardDescription>
            Sua conta está pronta. Redirecionando...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
