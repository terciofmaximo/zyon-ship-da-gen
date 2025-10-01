import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface OrgContextValue {
  organizations: Organization[];
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization) => void;
  loading: boolean;
  reloadOrganizations: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isPlatformAdmin, loading: roleLoading } = useUserRole();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrganizations([]);
      setActiveOrgState(null);
      setLoading(false);
      return;
    }

    // Wait for role to load before fetching orgs
    if (roleLoading) {
      return;
    }

    // Platform admins can see all orgs
    if (isPlatformAdmin) {
      fetchAllOrganizations();
      return;
    }

    fetchUserOrganizations();
  }, [user, isPlatformAdmin, roleLoading]);

  const fetchAllOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .order("name");

      if (error) throw error;

      const orgs: Organization[] = (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: "platformAdmin",
      }));

      setOrganizations(orgs);
      setActiveOrgState(null); // Default to "All Tenants" view
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to no-organization page if user has no orgs (but not platformAdmin)
  useEffect(() => {
    if (!loading && !roleLoading && user && organizations.length === 0 && !isPlatformAdmin) {
      // Check if we're not already on the no-organization page
      if (!window.location.pathname.includes('/no-organization') && 
          !window.location.pathname.includes('/invite') &&
          !window.location.pathname.includes('/auth')) {
        window.location.href = '/no-organization';
      }
    }
  }, [loading, roleLoading, user, organizations, isPlatformAdmin]);

  const fetchUserOrganizations = async () => {
    try {
      // Query organization_members directly instead of using the view
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          role,
          org_id,
          organizations!inner (
            id,
            name,
            slug
          )
        `)
        .eq("user_id", user!.id);

      if (error) throw error;

      const orgs: Organization[] = (data || []).map((item: any) => ({
        id: item.organizations.id,
        name: item.organizations.name,
        slug: item.organizations.slug,
        role: item.role,
      }));

      setOrganizations(orgs);

      // Load saved active org or default to first
      const savedOrgId = localStorage.getItem("active_org_id");
      const savedOrg = orgs.find(o => o.id === savedOrgId);
      
      if (savedOrg) {
        setActiveOrgState(savedOrg);
      } else if (orgs.length > 0) {
        setActiveOrgState(orgs[0]);
        localStorage.setItem("active_org_id", orgs[0].id);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const setActiveOrg = (org: Organization) => {
    setActiveOrgState(org);
    localStorage.setItem("active_org_id", org.id);
  };

  const reloadOrganizations = async () => {
    if (!user) return;
    if (isPlatformAdmin) {
      await fetchAllOrganizations();
    } else {
      await fetchUserOrganizations();
    }
  };

  return (
    <OrgContext.Provider value={{ organizations, activeOrg, setActiveOrg, loading, reloadOrganizations }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
};

// Convenience hook for just getting the active org ID
export const useActiveOrgId = () => {
  const { activeOrg } = useOrg();
  return activeOrg?.id || null;
};
