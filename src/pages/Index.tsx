import { DashboardStats } from "@/components/layout/DashboardStats";
import { NewPDAWizard } from "@/components/forms/NewPDAWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, History, Settings, LogIn, LogOut, User, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao fazer logout",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Logout",
        description: "Sessão encerrada com sucesso"
      });
    }
  };
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Maritime Operations Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Streamlined Disbursement Account Management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user.email}</span>
                  {isAdmin && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md">
                      <Shield className="h-3 w-3" />
                      <span className="text-xs font-medium">Admin</span>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          ) : (
            <Button asChild variant="default">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>

      <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <NewPDAWizard />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">MSC MAYA - PDA</p>
                    <p className="text-xs text-muted-foreground">Santos Port</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-xs sm:text-sm font-medium">$12,450</p>
                    <p className="text-xs text-muted-foreground">2h ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">ATLANTIC STAR - FDA</p>
                    <p className="text-xs text-muted-foreground">Rio Port</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-xs sm:text-sm font-medium">$8,720</p>
                    <p className="text-xs text-muted-foreground">4h ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">CARGO EXPRESS - PDA</p>
                    <p className="text-xs text-muted-foreground">Paranaguá Port</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-xs sm:text-sm font-medium">$15,230</p>
                    <p className="text-xs text-muted-foreground">6h ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/pda">
                    <FileText className="h-4 w-4 mr-2" />
                    View All DAs
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Tariffs
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <History className="h-4 w-4 mr-2" />
                  Export Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
};

export default Index;
