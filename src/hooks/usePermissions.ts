import { useCompany } from "@/context/CompanyProvider";
import { useUserRole } from "@/hooks/useUserRole";

export type Permission = 
  | "manage_team"           // owner/admin: invite, revoke, remove members
  | "manage_company"        // owner/admin: edit company settings
  | "use_product"          // member+: use product features
  | "read_only";           // viewer+: read-only access

export function usePermissions() {
  const { activeCompanyId, companies } = useCompany();
  const { isPlatformAdmin } = useUserRole();

  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const userRole = activeCompany?.role;

  const hasPermission = (permission: Permission): boolean => {
    // Platform admin has all permissions
    if (isPlatformAdmin) {
      return true;
    }

    // No active company = no permissions
    if (!activeCompany || !userRole) {
      return false;
    }

    switch (permission) {
      case "manage_team":
      case "manage_company":
        return userRole === "owner" || userRole === "admin";
      
      case "use_product":
        return userRole === "owner" || userRole === "admin" || userRole === "member";
      
      case "read_only":
        return ["owner", "admin", "member", "viewer"].includes(userRole);
      
      default:
        return false;
    }
  };

  const requirePermission = (permission: Permission) => {
    if (!hasPermission(permission)) {
      throw new Error(`Permission denied: ${permission}. Required role: ${getRequiredRole(permission)}, current role: ${userRole || 'none'}`);
    }
  };

  const getRequiredRole = (permission: Permission): string => {
    switch (permission) {
      case "manage_team":
      case "manage_company":
        return "owner or admin";
      case "use_product":
        return "member or higher";
      case "read_only":
        return "viewer or higher";
      default:
        return "unknown";
    }
  };

  return {
    activeCompany,
    userRole,
    hasPermission,
    requirePermission,
    // Convenience methods
    canManageTeam: hasPermission("manage_team"),
    canManageCompany: hasPermission("manage_company"),
    canUseProduct: hasPermission("use_product"),
    canRead: hasPermission("read_only"),
    // Role checks
    isOwner: userRole === "owner",
    isAdmin: userRole === "admin", 
    isMember: userRole === "member",
    isViewer: userRole === "viewer",
    isPlatformAdmin,
  };
}