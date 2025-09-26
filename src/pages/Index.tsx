import { Header } from "@/components/layout/Header";
import { DashboardStats } from "@/components/layout/DashboardStats";
import { NewPDAWizard } from "@/components/forms/NewPDAWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, History, Settings } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Maritime Operations Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Streamlined Disbursement Account Management
            </p>
          </div>
          <Button className="px-6">
            <Plus className="h-4 w-4 mr-2" />
            Quick PDA
          </Button>
        </div>

        <DashboardStats />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <NewPDAWizard />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">MSC MAYA - PDA</p>
                    <p className="text-xs text-muted-foreground">Santos Port</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">$12,450</p>
                    <p className="text-xs text-muted-foreground">2h ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">ATLANTIC STAR - FDA</p>
                    <p className="text-xs text-muted-foreground">Rio Port</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">$8,720</p>
                    <p className="text-xs text-muted-foreground">4h ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">CARGO EXPRESS - PDA</p>
                    <p className="text-xs text-muted-foreground">Paranaguá Port</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">$15,230</p>
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
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View All DAs
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
      </main>
    </div>
  );
};

export default Index;
