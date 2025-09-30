import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-primary" />
          </div>
          <CardTitle>Verifique seu Email</CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para o seu email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Próximos Passos:</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 mt-2">
                  <li>Abra seu email corporativo</li>
                  <li>Clique no link de confirmação</li>
                  <li>Faça login para acessar o sistema</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            Não recebeu o email? Verifique sua caixa de spam.
          </div>

          <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
            Voltar para Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
