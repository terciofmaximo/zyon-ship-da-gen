import {
  LayoutDashboard,
  FileText,
  Calendar,
  DollarSign,
  Receipt,
  BarChart3,
  Users,
  Settings,
  User
} from "lucide-react";
import { NavLink } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import zyonLogoIcon from "@/assets/zyon-logo-icon.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "PDA", url: "/pda", icon: FileText },
  { title: "Schedules", url: "/schedules", icon: Calendar },
  { title: "FDA", url: "/fda", icon: FileText },
  { title: "Financial", url: "/financial", icon: DollarSign },
  { title: "Billing", url: "/billing", icon: Receipt },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        {/* Logo Section */}
        <div className="flex items-center justify-center px-4 py-6">
          <img 
            src={zyonLogoIcon} 
            alt="Zyon Shipping" 
            className="h-8 w-auto"
          />
        </div>

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center justify-center w-8 h-8 bg-sidebar-accent rounded-full">
            <User className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sidebar-foreground text-sm font-medium">Administrator</p>
              <p className="text-sidebar-foreground/70 text-xs">admin@zyonshipping.com</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}