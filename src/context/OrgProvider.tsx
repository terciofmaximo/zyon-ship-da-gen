import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

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
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
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

    fetchUserOrganizations();
  }, [user]);

  const fetchUserOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          role,
          organizations:org_id (
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

  return (
    <OrgContext.Provider value={{ organizations, activeOrg, setActiveOrg, loading }}>
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
