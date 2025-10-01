import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import zyonLogo from "@/assets/zyon-logo-main.png";

const emailSchema = z.string().email("Email inválido");

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setError(emailValidation.error.issues[0].message);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (resetError) throw resetError;

      setEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar email de recuperação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img src={zyonLogo} alt="Zyon Logo" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-xl text-center">
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-center">
            {emailSent 
              ? "Email enviado com sucesso" 
              : "Digite seu email para receber instruções de recuperação"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg border text-center">
                <p className="text-sm text-muted-foreground">
                  Enviamos um email para <strong>{email}</strong> com instruções para redefinir sua senha.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Verifique sua caixa de entrada e spam.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
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
                    Enviando...
                  </>
                ) : (
                  "Enviar instruções"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
