import { z } from 'zod';

export const pdaStep1Schema = z.object({
  vesselName: z.string().min(1, 'Vessel name is required'),
  imoNumber: z.string().optional(),
  dwt: z.string().min(1, 'DWT is required'),
  loa: z.string().min(1, 'LOA is required'),
  beam: z.string().min(1, 'Beam is required'),
  draft: z.string().min(1, 'Draft is required'),
  portName: z.string().min(1, 'Port name is required'),
  berth: z.string().optional(),
  daysAlongside: z.string().optional(),
  cargo: z.string().optional(),
  quantity: z.string().optional(),
  from: z.string().min(1, 'From is required'),
  to: z.string().min(1, 'To is required'),
  date: z.string().min(1, 'Date is required'),
  exchangeRate: z.string().min(1, 'Exchange rate is required'),
});

export type PDAStep1Data = z.infer<typeof pdaStep1Schema>;