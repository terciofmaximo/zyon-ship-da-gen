import { DashboardStats } from "@/components/layout/DashboardStats";
import { NewPDAWizard } from "@/components/forms/NewPDAWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { FileText, Plus, History, Settings } from "lucide-react";

const Index = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 px-3 sm:px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <Button className="px-3 sm:px-6">
              <Plus className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Quick PDA</span>
            </Button>
          </header>
          
          <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Maritime Operations Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Streamlined Disbursement Account Management
              </p>
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
