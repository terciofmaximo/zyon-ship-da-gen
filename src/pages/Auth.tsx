import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useResetAdminPassword } from "@/hooks/useResetAdminPassword";


const schema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255),
  password: z.string().min(6, { message: "Mínimo de 6 caracteres" }).max(128),
});

type FormState = {
  email: string;
  password: string;
};

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [pending, setPending] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetAdminPassword, loading: resetLoading } = useResetAdminPassword();

  // Platform admin configuration
  const PLATFORM_ADMIN_EMAIL = 'contact@vesselopsportal.com';

  const redirectTo = useMemo(() => {
    const callback = searchParams.get("callback");
    const from = searchParams.get("from");
    return callback ? decodeURIComponent(callback) : decodeURIComponent(from || "/");
  }, [searchParams]);

  useEffect(() => {
    document.title = mode === "login" ? "Entrar • Zyon" : "Cadastrar • Zyon";
  }, [mode]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
      toast({ title: "Erro", description: msg, variant: "destructive" });
      return;
    }
    setPending(true);
    try {
      if (mode === "login") {
        console.log('Attempting login for:', form.email);
        
        // Normalize email for signin
        const normalizedEmail = form.email.toLowerCase().trim();
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: form.password,
        });
        
        if (error) {
          console.error('Login error:', {
            message: error.message,
            status: error.status,
            code: error.code,
            name: error.name,
          });
          throw error;
        }

        console.log('Login successful:', {
          userId: data.user?.id,
          email: data.user?.email,
          emailConfirmed: data.user?.email_confirmed_at,
        });

        // Check if user must reset password
        if (data.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('must_reset_password')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (profile?.must_reset_password) {
            toast({ 
              title: "Password Reset Required", 
              description: "You must reset your password before continuing" 
            });
            navigate('/auth/reset-password?forced=true', { replace: true });
            return;
          }
        }
        
        toast({ title: "Bem-vindo", description: "Login efetuado com sucesso" });
        navigate(redirectTo, { replace: true });
      } else {
        // Normalize email for signup
        const normalizedEmail = form.email.toLowerCase().trim();
        
        const redirectUrl = `${import.meta.env.VITE_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')}/`;
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: form.password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast({ title: "Verifique seu e-mail", description: "Confirme seu cadastro para prosseguir" });
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      
      let errorMessage = "Login failed. Please try again.";
      
      // Provide more specific error messages
      if (err?.message) {
        if (err.message.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password. Please check your credentials.";
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = "Please confirm your email address before logging in.";
        } else if (err.message.includes('User not found')) {
          errorMessage = "No account found with this email.";
        } else {
          errorMessage = err.message;
        }
      }
      
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </CardTitle>
          <CardDescription>
            {mode === "login" ? "Acesse para criar e salvar PDAs" : "Cadastre-se para começar a usar"}
          </CardDescription>
          {mode === "login" && (
            <div className="mt-4 p-3 bg-muted rounded-lg border">
              <p className="text-sm font-medium text-muted-foreground mb-2">🔑 Platform Admin:</p>
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> {PLATFORM_ADMIN_EMAIL}</p>
                <p><strong>Senha:</strong> Admin123!</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Full platform access</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">E-mail</label>
              <Input id="email" name="email" type="email" value={form.email} onChange={onChange} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">Senha</label>
              <Input id="password" name="password" type="password" value={form.password} onChange={onChange} required />
            </div>
            <Button type="submit" disabled={pending} className="w-full">{pending ? "Aguarde..." : (mode === "login" ? "Entrar" : "Cadastrar")}</Button>
          </form>
          <Separator className="my-6" />
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {mode === "login" ? (
                <button className="underline" onClick={() => setMode("signup")}>Não tem conta? Cadastre-se</button>
              ) : (
                <button className="underline" onClick={() => setMode("login")}>Já tem conta? Entrar</button>
              )}
            </div>
            {mode === "login" && (
              <div className="text-center pt-2 border-t space-y-2">
                <button 
                  className="text-xs text-muted-foreground hover:text-foreground underline block mx-auto"
                  onClick={() => navigate('/seed-admin')}
                >
                  🔧 Seed Platform Admin (Dev Tool)
                </button>
                <button 
                  className="text-xs text-muted-foreground hover:text-foreground underline block mx-auto"
                  onClick={resetAdminPassword}
                  disabled={resetLoading}
                >
                  🔑 Resetar Senha Admin {resetLoading && "(...)"}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default AuthPage;
