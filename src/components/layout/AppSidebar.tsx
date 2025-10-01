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
import zyonLogoFinal from "@/assets/zyon-logo-final.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "PDA", url: "/pda", icon: FileText },
  { title: "Schedule", url: "/schedule", icon: Calendar },
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        {/* Logo Section - only show when expanded */}
        {!collapsed && (
          <div className="flex items-center justify-center px-4 py-4 sm:py-6">
            <img 
              src={zyonLogoFinal} 
              alt="Zyon Shipping" 
              className="h-8 sm:h-10 w-auto max-w-full"
            />
          </div>
        )}

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
                        `flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm ${
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
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
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-sidebar-accent rounded-full flex-shrink-0">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sidebar-foreground text-xs sm:text-sm font-medium truncate">Administrator</p>
              <p className="text-sidebar-foreground/70 text-xs truncate">admin@zyonshipping.com</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}