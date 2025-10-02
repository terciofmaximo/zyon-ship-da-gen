import { z } from 'zod';

// Helper function to convert locale numbers (32,3 -> 32.3, remove thousands separators)
const toNumber = (v: unknown) => {
  if (typeof v === 'string') {
    // Remove thousands separators and convert comma to dot for decimal
    const normalized = v.replace(/\./g, '').replace(',', '.');
    const num = Number(normalized);
    return isNaN(num) ? 0 : num;
  }
  return Number(v) || 0;
};

// PDA Status enum matching the database
export const PDAStatus = z.enum([
  'CREATED',
  'IN_PROGRESS', 
  'SENT',
  'APPROVED'
]);

// Comprehensive PDA input validation schema
export const PDAInputSchema = z.object({
  // Ship/Vessel data
  vessel: z.object({
    name: z.string().trim().min(1, "Vessel name is required"),
    imo: z.string().optional().nullable(),
    dwt: z.preprocess(toNumber, z.number().min(1, "DWT must be greater than 0")),
    loa: z.preprocess(toNumber, z.number().min(1, "LOA must be greater than 0")), 
    beam: z.preprocess(toNumber, z.number().min(1, "Beam must be greater than 0")),
    draft: z.preprocess(toNumber, z.number().min(0, "Draft must be 0 or greater")),
  }),
  
  // Port and cargo data
  portCargo: z.object({
    port: z.string().trim().min(1, "Port is required"),
    terminal: z.string().optional().nullable(),
    berths: z.array(z.string()).optional().default([]),
    daysAlongside: z.preprocess(toNumber, z.number().int().min(0, "Days alongside must be 0 or greater")).default(0),
    cargo: z.string().optional().nullable(),
    quantity: z.preprocess(toNumber, z.number().min(0, "Quantity must be 0 or greater")).optional().nullable(),
  }),
  
  // Location and routing
  from: z.string().trim().min(1, "Origin location is required"),
  to: z.string().trim().optional().nullable(),
  toClientId: z.string().optional().nullable(),
  
  // Date and exchange rate
  date: z.string().min(1, "Date is required"),
  exchangeRate: z.preprocess(toNumber, z.number().positive("Exchange rate must be positive")).optional(),
  exchangeRateSource: z.enum(['BCB_PTAX_D1', 'MANUAL', 'PROVIDER_X']).optional(),
  exchangeRateSourceUrl: z.string().url().optional().or(z.literal("")),
  exchangeRateTimestamp: z.string().optional(),
  
  // Status and metadata
  status: PDAStatus.default('CREATED'),
  
  // Cost items - flexible structure to maintain compatibility
  costItems: z.record(z.string(), z.preprocess(toNumber, z.number().min(0))).optional().default({}),
  
  // Custom cost lines
  customLines: z.array(z.object({
    id: z.string(),
    label: z.string(),
    costUSD: z.preprocess(toNumber, z.number().min(0)),
    comment: z.string()
  })).optional(),
  
  // Additional fields
  remarks: z.string().optional(),
  comments: z.record(z.string(), z.string()).optional(),
}).strict(); // Reject unknown properties

export type PDAInputData = z.infer<typeof PDAInputSchema>;

// Schema for updating existing PDAs (all fields optional except ID)
export const PDAUpdateSchema = PDAInputSchema.partial();

export type PDAUpdateData = z.infer<typeof PDAUpdateSchema>;