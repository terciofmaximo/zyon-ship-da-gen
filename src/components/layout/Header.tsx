import { Settings, User, Users, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrgSwitcher } from "./OrgSwitcher";
import { CompanySwitcher } from "./CompanySwitcher";
import { useOrg } from "@/context/OrgProvider";
import { useCompany } from "@/context/CompanyProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { useAuthService } from "@/hooks/useAuthService";


export function Header() {
  const navigate = useNavigate();
  const { organizations, activeOrg } = useOrg();
  const { companies, activeCompanyId } = useCompany();
  const { isPlatformAdmin } = useUserRole();
  const { user } = useAuth();
  const { signOut } = useAuthService();
  const showOrgSwitcher = organizations.length > 1 || isPlatformAdmin;
  const showCompanySwitcher = companies.length > 1;
  
  // Check if user is admin/owner of the active org/company
  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const canInvite = isPlatformAdmin || (activeOrg && ['admin', 'owner'].includes(activeOrg.role)) || 
                   (activeCompany && ['admin', 'owner'].includes(activeCompany.role));

  return (
    <>
      {/* Platform Admin Global Banner */}
      {isPlatformAdmin && (
        <div className="sticky top-0 z-[60] bg-warning/90 backdrop-blur-sm border-b border-warning-foreground/20">
          <div className="flex h-10 items-center justify-center px-6 text-warning-foreground">
            <div className="flex items-center gap-2 font-medium text-sm">
              <span className="text-lg">⚠️</span>
              <span>Modo Platform Admin - Suas ações afetam TODOS os tenants</span>
            </div>
          </div>
        </div>
      )}
      
      <header className={`sticky ${isPlatformAdmin ? 'top-10' : 'top-0'} z-50 border-b bg-background shadow-soft`}>
        <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8" />
        </div>

        <div className="flex items-center gap-4">
          {showCompanySwitcher && <CompanySwitcher />}
          {showOrgSwitcher && <OrgSwitcher />}
          
          {(activeOrg || activeCompany) && canInvite && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  People
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/settings?tab=people')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Organization Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {isPlatformAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                  <Settings className="h-4 w-4 mr-2" />
                  Platform Admin
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/platform-admin')}>
                  User Management
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Tariff Management</DropdownMenuItem>
                <DropdownMenuItem>Port Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground max-w-[200px]">
                <User className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{user?.email || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    </>
  );
}