import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, TrendingDown, Ship, DollarSign, AlertCircle, LogIn, LogOut, User, Shield, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrg } from "@/context/OrgProvider";
import { useDashboardKpis } from "@/hooks/useDashboardKpis";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { activeOrg } = useOrg();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis(activeOrg?.id || null);
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity(activeOrg?.id || null);

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

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const pdaChange = kpis ? calculateChange(kpis.pdaCount, kpis.pdaPrevCount) : 0;
  const revenueChange = kpis ? calculateChange(kpis.revenueThisQ, kpis.revenuePrevQ) : 0;

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Visão geral das operações
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* PDAs geradas (trimestre) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              PDAs Geradas (Trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? "..." : kpis?.pdaCount || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              {pdaChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${pdaChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                {pdaChange.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs. tri. anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* FDAs abertas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              FDAs Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{kpisLoading ? "..." : kpis?.fdaOpenCount || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">em operação</p>
          </CardContent>
        </Card>

        {/* Total revenue (trimestre) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita (Trimestre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">
                ${kpisLoading ? "..." : (kpis?.revenueThisQ || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${revenueChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                {revenueChange.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs. tri. anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Pendências */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pendências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => navigate("/fda?status=open&side=AR")}
              className="w-full flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Recebíveis</span>
              </div>
              <Badge variant="outline" className="text-green-600">
                ${kpisLoading ? "..." : (kpis?.arOpenTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Badge>
            </button>
            <button
              onClick={() => navigate("/fda?status=open&side=AP")}
              className="w-full flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Pagáveis</span>
              </div>
              <Badge variant="outline" className="text-red-600">
                ${kpisLoading ? "..." : (kpis?.apOpenTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Badge>
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activitiesLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : activities && activities.length > 0 ? (
                activities.map((activity, idx) => (
                  <Link
                    key={idx}
                    to={activity.href}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      {activity.amount !== undefined && (
                        <p className="text-sm font-medium">${activity.amount.toLocaleString("en-US")}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/pda">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver todas as PDAs
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/fda">
                  <Ship className="h-4 w-4 mr-2" />
                  Ver todas as FDAs
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/fda?status=open&side=AR">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Recebíveis em aberto
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/fda?status=open&side=AP">
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
                  Pagáveis em aberto
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
