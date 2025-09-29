import React, { createContext, useContext, useEffect, useState } from "react";
import { useTenantResolver } from "@/hooks/useTenantResolver";
import { useNavigate } from "react-router-dom";

interface TenantContextValue {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  primaryDomain: string | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant, loading, shouldRedirect, canonicalUrl } = useTenantResolver();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to canonical domain if needed
    if (shouldRedirect && canonicalUrl) {
      window.location.href = canonicalUrl;
    }
  }, [shouldRedirect, canonicalUrl]);

  const contextValue: TenantContextValue = {
    tenantId: tenant?.id || null,
    tenantSlug: tenant?.slug || null,
    tenantName: tenant?.name || null,
    primaryDomain: tenant?.primary_domain || null,
    loading,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
};
