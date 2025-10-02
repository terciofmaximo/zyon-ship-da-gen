export interface ShipData {
  vesselName: string;
  imoNumber?: string;
  dwt: string;
  loa: string;
  port: string;
  terminal?: string;
  cargoType?: string;
  arrivalDate: string;
  departureDate?: string;
  agent?: string;
  exchangeRate: string;
  exchangeRateSource?: string;
  exchangeRateTimestamp?: string;
}

export interface CustomCostLine {
  id: string;
  label: string;
  costUSD: number;
  comment: string;
}

export interface CostData {
  pilotageIn: number;
  towageIn: number;
  lightDues: number;
  dockage: number;
  linesman: number;
  launchBoat: number;
  immigration: number;
  freePratique: number;
  shippingAssociation: number;
  clearance: number;
  paperlessPort: number;
  agencyFee: number;
  waterway: number;
  iof: number;
  bankCharges: number;
  customLines?: CustomCostLine[];
}

export interface PDAData {
  shipData: ShipData;
  costData: CostData;
}