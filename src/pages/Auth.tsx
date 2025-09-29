import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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

  const redirectTo = useMemo(() => decodeURIComponent(searchParams.get("from") || "/pda"), [searchParams]);

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
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast({ title: "Bem-vindo", description: "Login efetuado com sucesso" });
        navigate(redirectTo, { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast({ title: "Verifique seu e-mail", description: "Confirme seu cadastro para prosseguir" });
      }
    } catch (err: any) {
      const msg = err?.message ?? "Falha na autenticação";
      toast({ title: "Erro", description: msg, variant: "destructive" });
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
              <p className="text-sm font-medium text-muted-foreground mb-2">🔑 Conta Admin:</p>
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> admin@zyon.com</p>
                <p><strong>Senha:</strong> Admin123!</p>
              </div>
              <p className="text-xs text-orange-600 mt-2 font-medium">⚠️ Primeira vez? Clique em "Cadastre-se" para criar a conta admin</p>
              <p className="text-xs text-muted-foreground mt-1">Depois de criar, volte aqui para fazer login</p>
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
          <div className="text-sm text-muted-foreground">
            {mode === "login" ? (
              <button className="underline" onClick={() => setMode("signup")}>Não tem conta? Cadastre-se</button>
            ) : (
              <button className="underline" onClick={() => setMode("login")}>Já tem conta? Entrar</button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default AuthPage;
