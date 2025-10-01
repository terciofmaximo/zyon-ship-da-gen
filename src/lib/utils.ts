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
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format decimal numbers with comma separator
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
