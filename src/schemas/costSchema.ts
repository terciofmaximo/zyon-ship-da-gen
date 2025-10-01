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

// Cost Entry Schema - for PDA cost entry form
export const costEntrySchema = z.object({
  pilotageIn: normalizeNumber.refine((val) => val >= 0, 'Pilotage cost must be positive or zero'),
  towageIn: normalizeNumber.refine((val) => val >= 0, 'Towage cost must be positive or zero'),
  lightDues: normalizeNumber.refine((val) => val >= 0, 'Light dues must be positive or zero'),
  dockage: normalizeNumber.refine((val) => val >= 0, 'Dockage must be positive or zero'),
  linesman: normalizeNumber.refine((val) => val >= 0, 'Linesman cost must be positive or zero'),
  launchBoat: normalizeNumber.refine((val) => val >= 0, 'Launch boat cost must be positive or zero'),
  immigration: normalizeNumber.refine((val) => val >= 0, 'Immigration cost must be positive or zero'),
  freePratique: normalizeNumber.refine((val) => val >= 0, 'Free pratique cost must be positive or zero'),
  shippingAssociation: normalizeNumber.refine((val) => val >= 0, 'Shipping association cost must be positive or zero'),
  clearance: normalizeNumber.refine((val) => val >= 0, 'Clearance cost must be positive or zero'),
  paperlessPort: normalizeNumber.refine((val) => val >= 0, 'Paperless port cost must be positive or zero'),
  agencyFee: normalizeNumber.refine((val) => val >= 0, 'Agency fee must be positive or zero'),
  waterway: normalizeNumber.refine((val) => val >= 0, 'Waterway cost must be positive or zero'),
});

// Cost comments schema
export const costCommentsSchema = z.record(
  z.string(),
  z.string().max(500, 'Comment must be less than 500 characters')
);

// Remarks schema
export const remarksSchema = z.string()
  .max(10000, 'Remarks must be less than 10,000 characters')
  .optional();

// Complete cost entry with metadata
export const fullCostEntrySchema = z.object({
  costs: costEntrySchema,
  comments: costCommentsSchema.optional(),
  remarks: remarksSchema,
});

// Export types
export type CostEntry = z.infer<typeof costEntrySchema>;
export type CostComments = z.infer<typeof costCommentsSchema>;
export type FullCostEntry = z.infer<typeof fullCostEntrySchema>;
