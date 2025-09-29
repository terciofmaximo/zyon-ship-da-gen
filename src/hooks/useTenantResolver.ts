import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  primary_domain: string;
}

interface UseTenantResolverResult {
  tenant: TenantInfo | null;
  loading: boolean;
  error: string | null;
  shouldRedirect: boolean;
  canonicalUrl: string | null;
}

export function useTenantResolver(): UseTenantResolverResult {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [canonicalUrl, setCanonicalUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const resolveTenant = async () => {
      try {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        const search = window.location.search;
        
        let tenantData: TenantInfo | null = null;
        let slug: string | null = null;
        
        // Dev mode: allow localhost or 127.0.0.1
        const isDev = hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.includes('lovableproject.com');
        
        if (!isDev) {
          // Production: Try to resolve by hostname first
          const { data, error: hostnameError } = await supabase
            .rpc('get_tenant_by_hostname', { hostname });
          
          if (hostnameError) {
            console.error('Error resolving tenant by hostname:', hostnameError);
          } else if (data && data.length > 0) {
            tenantData = data[0];
          }
        }
        
        // Fallback: resolve by /t/{slug} path
        if (!tenantData && pathname.startsWith('/t/')) {
          const pathParts = pathname.split('/');
          if (pathParts.length >= 3) {
            slug = pathParts[2];
            
            const { data, error: slugError } = await supabase
              .from('organizations')
              .select('id, name, slug, primary_domain')
              .eq('slug', slug)
              .single();
            
            if (slugError) {
              console.error('Error resolving tenant by slug:', slugError);
              setError('Tenant not found');
            } else if (data) {
              tenantData = {
                id: data.id,
                name: data.name,
                slug: data.slug,
                primary_domain: data.primary_domain || '',
              };
            }
          }
        }
        
        if (!tenantData) {
          // No tenant context - allow for platformAdmin or public routes
          const isAuthRoute = pathname.startsWith('/auth') || pathname.startsWith('/invite');
          if (!isAuthRoute && !pathname.startsWith('/platform-admin')) {
            setError('Tenant not found');
          }
          setLoading(false);
          return;
        }
        
        // Check if we need to redirect to canonical domain
        if (!isDev && tenantData.primary_domain) {
          const currentHost = hostname;
          const canonicalHost = tenantData.primary_domain;
          
          if (currentHost !== canonicalHost) {
            // Need to redirect to canonical domain
            const canonicalFullUrl = `https://${canonicalHost}${pathname}${search}`;
            setCanonicalUrl(canonicalFullUrl);
            setShouldRedirect(true);
          }
        }
        
        setTenant(tenantData);
      } catch (err: any) {
        console.error('Error in tenant resolver:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    resolveTenant();
  }, [navigate]);

  return { tenant, loading, error, shouldRedirect, canonicalUrl };
}
