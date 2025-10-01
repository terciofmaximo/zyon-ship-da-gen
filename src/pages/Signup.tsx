import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { signupSchema, type SignupData } from "@/schemas/signupSchema";
import { Building2, Mail } from "lucide-react";
import { getSessionId } from "@/utils/sessionTracking";

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  
  const [formData, setFormData] = useState<SignupData>({
    fullName: "",
    email: "",
    companyName: "",
    cnpj: "",
    companyType: "Agente" as const,
    password: "",
    confirmPassword: "",
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof SignupData, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate with zod
    const validation = signupSchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof SignupData, string>> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignupData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const sessionId = getSessionId();
      
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            cnpj: formData.cnpj,
            company_type: formData.companyType,
            session_id: sessionId,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirmed?returnUrl=${encodeURIComponent(returnUrl)}`,
        },
      });

      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // If email confirmation is disabled, manually trigger organization association
      if (authData.user.email_confirmed_at) {
        const { error: orgError } = await supabase.rpc("auto_associate_organization_by_domain", {
          p_user_id: authData.user.id,
          p_email: formData.email,
          p_company_name: formData.companyName,
          p_cnpj: formData.cnpj,
          p_company_type: formData.companyType,
          p_session_id: sessionId,
        });

        if (orgError) {
          console.error("Organization association error:", orgError);
          // Don't throw - user is created, they can try again
        }
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar o cadastro.",
      });

      // Redirect to email verification message or directly if confirmed
      if (authData.user.email_confirmed_at) {
        navigate("/auth/confirmed");
      } else {
        navigate("/auth/verify-email");
      }
      
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao criar sua conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar Conta Corporativa</CardTitle>
          <CardDescription>
            Preencha os dados da sua empresa para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="João Silva"
                  required
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Corporativo *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@empresa.com.br"
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 inline mr-1" />
                  Não aceitamos emails pessoais (Gmail, Hotmail, etc)
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Empresa LTDA"
                  required
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  required
                />
                {errors.cnpj && (
                  <p className="text-sm text-destructive">{errors.cnpj}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyType">Tipo de Empresa *</Label>
              <Select
                value={formData.companyType}
                onValueChange={(value: any) => setFormData({ ...formData, companyType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Armador">Armador</SelectItem>
                  <SelectItem value="Agente">Agente</SelectItem>
                  <SelectItem value="Broker">Broker</SelectItem>
                </SelectContent>
              </Select>
              {errors.companyType && (
                <p className="text-sm text-destructive">{errors.companyType}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repita a senha"
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                Já tenho conta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
