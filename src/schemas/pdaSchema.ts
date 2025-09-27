import { z } from 'zod';

export const pdaStep1Schema = z.object({
  vesselName: z.string().optional(),
  imoNumber: z.string().optional(),
  dwt: z.string().optional(),
  loa: z.string().optional(),
  beam: z.string().optional(),
  draft: z.string().optional(),
  portName: z.string().optional(),
  berth: z.string().optional(),
  daysAlongside: z.string().optional(),
  cargo: z.string().optional(),
  quantity: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  toClientId: z.string().optional(),
  date: z.string().optional(),
  exchangeRate: z.string().optional(),
  exchangeRateSource: z.enum(['BCB_PTAX_D1', 'MANUAL', 'PROVIDER_X']).optional(),
  exchangeRateSourceUrl: z.string().optional(),
  exchangeRateTimestamp: z.string().optional(),
});

export type PDAStep1Data = z.infer<typeof pdaStep1Schema>;