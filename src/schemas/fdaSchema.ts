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

// FDA Status enum
export const FDAStatus = z.enum(['Draft', 'Approved', 'Settled', 'Cancelled'] as const);

// FDA Header Schema
export const fdaHeaderSchema = z.object({
  client_name: z.string()
    .trim()
    .min(1, 'Client name is required')
    .max(200, 'Client name must be less than 200 characters'),
  port: z.string()
    .trim()
    .min(1, 'Port is required')
    .max(100, 'Port name must be less than 100 characters'),
  terminal: z.string()
    .trim()
    .max(100, 'Terminal must be less than 100 characters')
    .optional(),
  berth: z.string()
    .trim()
    .max(50, 'Berth must be less than 50 characters')
    .optional(),
  vessel_name: z.string()
    .trim()
    .max(200, 'Vessel name must be less than 200 characters')
    .optional(),
  imo: z.string()
    .trim()
    .regex(/^(\d{7})?$/, 'IMO number must be 7 digits')
    .optional()
    .or(z.literal('')),
  currency_base: z.string().default('USD'),
  currency_local: z.string().default('BRL'),
  exchange_rate: normalizeNumber
    .refine((val) => val > 0, 'Exchange rate must be positive'),
});

// FDA Ledger Line Schema
export const fdaLedgerLineSchema = z.object({
  side: z.union([z.literal('AP'), z.literal('AR')]),
  category: z.string()
    .trim()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  description: z.string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
  counterparty: z.string()
    .trim()
    .min(1, 'Counterparty is required')
    .max(200, 'Counterparty must be less than 200 characters'),
  amount_usd: normalizeNumber
    .refine((val) => val >= 0, 'Amount must be positive or zero'),
  invoice_no: z.string()
    .trim()
    .max(100, 'Invoice number must be less than 100 characters')
    .optional(),
  due_date: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Invalid date format'),
  status: z.union([z.literal('Open'), z.literal('Settled'), z.literal('Partially Settled')]).default('Open'),
});

// Complete FDA Creation Schema
export const fdaCreationSchema = z.object({
  header: fdaHeaderSchema,
  ledgerLines: z.array(fdaLedgerLineSchema)
    .min(1, 'At least one ledger line is required'),
  receivedFromClient: normalizeNumber
    .refine((val) => val >= 0, 'Received amount must be positive or zero')
    .optional()
    .default(0),
});

// Export types
export type FDAHeader = z.infer<typeof fdaHeaderSchema>;
export type FDALedgerLine = z.infer<typeof fdaLedgerLineSchema>;
export type FDACreation = z.infer<typeof fdaCreationSchema>;
