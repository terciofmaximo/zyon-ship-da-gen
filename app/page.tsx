import { DashboardStats } from '@/components/layout/dashboard-stats'
import { NewPDAWizard } from '@/components/forms/new-pda-wizard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Activity, Clock, FileText, Plus, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Maritime Operations Dashboard</h1>
            <p className="text-muted-foreground">
              Manage vessel operations, disbursement accounts, and financial documentation
            </p>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Quick PDA
        </Button>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* New PDA Wizard */}
        <div className="xl:col-span-2">
          <NewPDAWizard />
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span className="text-muted-foreground">MSC MAYA PDA completed</span>
                <span className="ml-auto text-xs text-muted-foreground">2h ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 bg-accent rounded-full" />
                <span className="text-muted-foreground">New vessel arrival scheduled</span>
                <span className="ml-auto text-xs text-muted-foreground">4h ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 bg-success rounded-full" />
                <span className="text-muted-foreground">FDA document exported</span>
                <span className="ml-auto text-xs text-muted-foreground">6h ago</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Recent PDAs
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Schedule Management
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Financial Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}