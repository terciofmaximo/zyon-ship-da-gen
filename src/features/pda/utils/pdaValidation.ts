import { getGlobalPortOptions, getGlobalTerminalOptions, getGlobalBerthOptions } from "@/services/globalPortDirectory";

// Error codes for structured error handling
export const PDA_ERROR_CODES = {
  E_PDA_VALIDATION: 'E_PDA_VALIDATION',
  E_DB_CONSTRAINT: 'E_DB_CONSTRAINT', 
  E_ENUM_MISMATCH: 'E_ENUM_MISMATCH',
  E_PORT_VALIDATION: 'E_PORT_VALIDATION',
  E_NETWORK_ERROR: 'E_NETWORK_ERROR',
  E_AUTH_ERROR: 'E_AUTH_ERROR',
  E_UNKNOWN: 'E_UNKNOWN'
} as const;

export type PDAErrorCode = keyof typeof PDA_ERROR_CODES;

// Structured error interface
export interface PDAError {
  errorId: string;
  code: PDAErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// Generate unique error ID for tracking
export function generateErrorId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Create structured error
export function createPDAError(
  code: PDAErrorCode, 
  message: string, 
  field?: string, 
  details?: Record<string, unknown>
): PDAError {
  return {
    errorId: generateErrorId(),
    code,
    message,
    field,
    details
  };
}

// Validate port/terminal/berth combinations against global directory
export interface PortValidationResult {
  isValid: boolean;
  error?: PDAError;
}

export async function validatePortTerminalBerth(
  port: string, 
  terminal?: string | null, 
  berths?: string[]
): Promise<PortValidationResult> {
  try {
    // Check if port exists
    const portOptions = await getGlobalPortOptions();
    const portExists = portOptions.some(p => p.value === port || p.label === port);
    
    if (!portExists) {
      return {
        isValid: false,
        error: createPDAError(
          'E_PORT_VALIDATION',
          `Port "${port}" not found in global directory`,
          'portCargo.port'
        )
      };
    }
    
    // If terminal is provided, validate it exists under the port
    if (terminal) {
      const terminalOptions = await getGlobalTerminalOptions(port);
      const terminalExists = terminalOptions.some(t => t.value === terminal || t.label === terminal);
      
      if (!terminalExists) {
        return {
          isValid: false,
          error: createPDAError(
            'E_PORT_VALIDATION',
            `Terminal "${terminal}" not found for port "${port}"`,
            'portCargo.terminal'
          )
        };
      }
      
      // If berths are provided, validate they exist under the terminal
      if (berths && berths.length > 0) {
        const berthOptions = await getGlobalBerthOptions(port, terminal);
        const availableBerths = berthOptions.map(b => b.value);
        
        for (const berth of berths) {
          if (!availableBerths.includes(berth)) {
            return {
              isValid: false,
              error: createPDAError(
                'E_PORT_VALIDATION',
                `Berth "${berth}" not found for terminal "${terminal}" at port "${port}"`,
                'portCargo.berths'
              )
            };
          }
        }
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: createPDAError(
        'E_PORT_VALIDATION',
        'Failed to validate port directory data',
        'portCargo.port',
        { originalError: error }
      )
    };
  }
}

// Log error for debugging (with sanitized payload)
export function logPDAError(
  error: PDAError, 
  userId?: string, 
  route?: string, 
  payload?: Record<string, unknown>
) {
  // Sanitize payload by removing sensitive data
  const sanitizedPayload = payload ? {
    ...payload,
    // Remove any potential sensitive fields
    password: '[REDACTED]',
    token: '[REDACTED]',
    apiKey: '[REDACTED]'
  } : undefined;
  
  console.error('PDA Error:', {
    errorId: error.errorId,
    code: error.code,
    message: error.message,
    field: error.field,
    userId,
    route,
    timestamp: new Date().toISOString(),
    payload: sanitizedPayload,
    stack: new Error().stack
  });
}