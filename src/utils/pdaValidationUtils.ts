// Utility functions for PDA form validation and error handling
import { ZodError } from 'zod';
import { validatePortTerminalBerth, createPDAError, type PDAError } from '@/lib/pdaValidation';

// Extract field-specific validation errors from Zod error
export function extractFieldErrors(zodError: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  zodError.issues.forEach(error => {
    const field = error.path.join('.');
    fieldErrors[field] = error.message;
  });
  
  return fieldErrors;
}

// Validate form data before submission
export interface ValidationResult {
  isValid: boolean;
  fieldErrors?: Record<string, string>;
  pdaError?: PDAError;
}

export function validateFormData(
  port: string,
  terminal?: string | null,
  berths?: string[]
): Promise<ValidationResult> {
  // Validate port/terminal/berth combination
  return validatePortTerminalBerth(port, terminal, berths).then(portValidation => {
    if (!portValidation.isValid && portValidation.error) {
      return {
        isValid: false,
        pdaError: portValidation.error,
        fieldErrors: {
          [portValidation.error.field || 'port']: portValidation.error.message
        }
      };
    }
    
    return { isValid: true };
  });
}

// Normalize numeric input (handle both locale formats)
export function normalizeNumericInput(value: string | number, locale: 'pt-BR' | 'en-US' = 'pt-BR'): number {
  if (typeof value === 'number') return value;
  
  if (locale === 'pt-BR') {
    // Brazilian format: dot as thousands separator, comma as decimal
    const normalized = value
      .replace(/\./g, '') // Remove dots (thousands separator)
      .replace(',', '.'); // Convert comma to dot (decimal separator)
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  } else {
    // US format: comma as thousands separator, dot as decimal
    const normalized = value.replace(/,/g, ''); // Remove commas (thousands separator)
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }
}

// Format number for display in locale format
export function formatNumberForLocale(value: number, locale: 'pt-BR' | 'en-US' = 'pt-BR'): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

// Check if a string represents a valid number in locale format
export function isValidLocaleNumber(value: string): boolean {
  if (!value || value.trim() === '') return false;
  
  // Allow numbers with comma as decimal separator and dots as thousands separator
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return !isNaN(parseFloat(normalized)) && isFinite(parseFloat(normalized));
}

// Debounced validation for real-time form feedback
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}