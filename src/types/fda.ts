export interface FDA {
  id: string;
  pda_id: string;
  status: "Draft" | "Posted" | "Closed";
  client_name?: string;
  client_id?: string;
  vessel_name?: string;
  imo?: string;
  port?: string;
  terminal?: string;
  currency_base: string;
  currency_local: string;
  exchange_rate?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  meta?: any;
  remarks?: string;
  tenant_id: string;
}

export interface FDALedger {
  id: string;
  fda_id: string;
  line_no: number;
  side: "AP" | "AR";
  category?: string;
  description?: string;
  counterparty?: string;
  amount_usd?: number;
  amount_local?: number;
  invoice_no?: string;
  due_date?: string;
  status: "Open" | "Settled" | "Partially Settled";
  source?: any;
  settled_at?: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  pda_field?: string;
  origin?: "PDA" | "MANUAL";
}

export interface FDAWithLedger extends FDA {
  ledger: FDALedger[];
}

export interface FDATotals {
  totalAP_USD: number;
  totalAP_BRL: number;
  totalAR_USD: number;
  totalAR_BRL: number;
  net_USD: number;
  net_BRL: number;
}

export interface FDARules {
  both: string[];
  ar_only: string[];
  ap_only: string[];
}