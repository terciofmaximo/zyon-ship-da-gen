import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRange(min: number, max: number, unit: string): string {
  return `${min.toLocaleString()} - ${max.toLocaleString()} ${unit}`;
}

// Format numbers with Brazilian locale (comma as decimal separator)
export function formatCurrency(value: number, currency: 'USD' | 'BRL' = 'USD'): string {
  if (currency === 'USD') {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } else {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

// Format decimal numbers - USD format (1,234.56) or BRL format (1.234,56)
export function formatNumber(value: number, decimals: number = 2, locale: 'pt-BR' | 'en-US' = 'pt-BR'): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// Get active tenant ID from OrgProvider context
// This ensures consistent tenant_id usage across all PDA/FDA operations
export function getActiveTenantId(activeOrg: { id: string } | null): string | null {
  return activeOrg?.id || null;
}
