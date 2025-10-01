import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import zyonLogo from "@/assets/zyon-logo-main.png";

const passwordSchema = z.string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const isForced = searchParams.get("forced") === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setErrors({ password: passwordValidation.error.issues[0].message });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "As senhas não coincidem" });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      
      if (updateError) throw updateError;

      // Update user profile to clear must_reset_password flag
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .update({ must_reset_password: false })
          .eq('user_id', user.id);
      }

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao redefinir senha",
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
          <CardTitle className="text-xl text-center">Redefinir Senha</CardTitle>
          <CardDescription className="text-center">
            {isForced 
              ? "Você precisa alterar sua senha antes de continuar."
              : "Digite uma nova senha para sua conta."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                required
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A senha deve ter pelo menos 8 caracteres com maiúscula, minúscula e número
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
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
                  Atualizando senha...
                </>
              ) : (
                "Atualizar Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
