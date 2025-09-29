import { Settings, User, Users } from "lucide-react";
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
import { InviteMemberDialog } from "@/components/organization/InviteMemberDialog";
import { useUserRole } from "@/hooks/useUserRole";


export function Header() {
  const { organizations, activeOrg } = useOrg();
  const { isAdmin, isPlatformAdmin } = useUserRole();
  const showOrgSwitcher = organizations.length > 1;
  const canInvite = isAdmin || isPlatformAdmin;

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
                <InviteMemberDialog />
                <DropdownMenuSeparator />
                <DropdownMenuItem>View Members</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Tariff Management</DropdownMenuItem>
              <DropdownMenuItem>Port Settings</DropdownMenuItem>
              <DropdownMenuItem>User Management</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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