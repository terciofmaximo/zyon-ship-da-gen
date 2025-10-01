import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { toast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  name: string;
  slug: string;
  primary_domain: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

interface CompanyContextType {
  companies: Company[];
  activeCompanyId: string | null;
  setActiveCompanyId: (companyId: string) => void;
  loading: boolean;
  refetch: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const ACTIVE_COMPANY_KEY = 'activeCompanyId';

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadCompanies = async () => {
    if (!user) {
      setCompanies([]);
      setActiveCompanyIdState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch user memberships with organization data
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select(`
          role,
          company_id,
          organizations!inner (
            id,
            name,
            slug,
            primary_domain
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching companies:', error);
        toast({
          title: 'Error',
          description: 'Failed to load companies',
          variant: 'destructive',
        });
        return;
      }

      const companyList = memberships?.map((membership: any) => ({
        id: membership.organizations.id,
        name: membership.organizations.name,
        slug: membership.organizations.slug,
        primary_domain: membership.organizations.primary_domain,
        role: membership.role,
      })) || [];

      setCompanies(companyList);

      // Set active company if not set or invalid
      const storedActiveId = localStorage.getItem(ACTIVE_COMPANY_KEY);
      const validActiveId = companyList.find(c => c.id === storedActiveId)?.id;
      
      if (validActiveId) {
        setActiveCompanyIdState(validActiveId);
      } else if (companyList.length > 0) {
        // Set first company as active
        const firstCompanyId = companyList[0].id;
        setActiveCompanyIdState(firstCompanyId);
        localStorage.setItem(ACTIVE_COMPANY_KEY, firstCompanyId);
      } else {
        setActiveCompanyIdState(null);
        localStorage.removeItem(ACTIVE_COMPANY_KEY);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setActiveCompanyId = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setActiveCompanyIdState(companyId);
      localStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
      
      toast({
        title: 'Company switched',
        description: `Switched to ${company.name}`,
      });
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [user]);

  const value: CompanyContextType = {
    companies,
    activeCompanyId,
    setActiveCompanyId,
    loading,
    refetch: loadCompanies,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}