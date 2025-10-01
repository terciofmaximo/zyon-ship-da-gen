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
}

export interface PDAData {
  shipData: ShipData;
  costData: CostData;
}