import { z } from 'zod';

// Helper to normalize number inputs
const normalizeNumber = z.preprocess((val) => {
  if (typeof val === 'string') {
    const normalized = val.replace(/,/g, '.').replace(/[^\d.-]/g, '');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }
  return Number(val) || 0;
}, z.number());

// Ship/Vessel Data Schema - for PDA ship data form
export const shipDataSchema = z.object({
  vesselName: z.string()
    .trim()
    .min(1, 'Vessel name is required')
    .max(200, 'Vessel name must be less than 200 characters'),
  imoNumber: z.string()
    .trim()
    .regex(/^(\d{7})?$/, 'IMO number must be 7 digits')
    .optional()
    .or(z.literal('')),
  dwt: normalizeNumber
    .refine((val) => val > 0, 'DWT must be greater than 0'),
  loa: normalizeNumber
    .refine((val) => val > 0, 'LOA must be greater than 0'),
  port: z.string()
    .trim()
    .min(1, 'Port is required'),
  terminal: z.string()
    .trim()
    .max(100, 'Terminal must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  cargoType: z.string()
    .trim()
    .max(100, 'Cargo type must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  arrivalDate: z.string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Invalid arrival date'),
  departureDate: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Invalid departure date'),
  agent: z.string()
    .trim()
    .max(200, 'Agent name must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  exchangeRate: normalizeNumber
    .refine((val) => val > 0, 'Exchange rate must be positive'),
});

// Export type
export type ShipData = z.infer<typeof shipDataSchema>;
