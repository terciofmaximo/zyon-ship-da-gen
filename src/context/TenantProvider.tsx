import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TenantContextValue {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const resolveTenant = async () => {
      try {
        // Get tenant slug from subdomain or path
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        let slug: string | null = null;
        
        // Check for subdomain (production)
        if (hostname.includes('.vesselopsportal.com')) {
          const parts = hostname.split('.');
          if (parts.length >= 3 && parts[0] !== 'www') {
            slug = parts[0];
          }
        }
        
        // Fallback: check for /t/{slug} path (development)
        if (!slug && pathname.startsWith('/t/')) {
          const pathParts = pathname.split('/');
          if (pathParts.length >= 3) {
            slug = pathParts[2];
          }
        }
        
        if (!slug) {
          // No tenant context - allow for platformAdmin root access
          setLoading(false);
          return;
        }
        
        // Fetch tenant by slug
        const { data, error } = await supabase
          .rpc('get_tenant_by_slug', { tenant_slug: slug });
        
        if (error) {
          console.error('Error fetching tenant:', error);
          navigate('/404');
          return;
        }
        
        if (!data || data.length === 0) {
          console.error('Tenant not found:', slug);
          navigate('/404');
          return;
        }
        
        const tenant = data[0];
        setTenantId(tenant.id);
        setTenantSlug(tenant.slug);
        setTenantName(tenant.name);
      } catch (error) {
        console.error('Error in tenant resolver:', error);
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };
    
    resolveTenant();
  }, [navigate]);

  return (
    <TenantContext.Provider value={{ tenantId, tenantSlug, tenantName, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
};
