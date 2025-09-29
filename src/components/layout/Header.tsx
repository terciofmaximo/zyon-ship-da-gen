import { Settings, User, Users, UserPlus } from "lucide-react";
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
import { useOrg } from "@/context/OrgProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";


export function Header() {
  const navigate = useNavigate();
  const { organizations, activeOrg } = useOrg();
  const { isPlatformAdmin } = useUserRole();
  const showOrgSwitcher = organizations.length > 1 || isPlatformAdmin;
  
  // Check if user is admin/owner of the active org
  const canInvite = isPlatformAdmin || (activeOrg && ['admin', 'owner'].includes(activeOrg.role));

  return (
    <header className="border-b bg-background shadow-soft">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8" />
        </div>

        <div className="flex items-center gap-4">
          {showOrgSwitcher && <OrgSwitcher />}
          
          {activeOrg && canInvite && (
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
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                <User className="h-4 w-4 mr-2" />
                Operations Analyst
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}