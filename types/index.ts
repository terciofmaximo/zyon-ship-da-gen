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
}

export interface CostData {
  pilotageIn: number;
  pilotageOut: number;
  towageIn: number;
  towageOut: number;
  dockage: number;
  waterway: number;
  portDues: number;
  security: number;
  customs: number;
  immigration: number;
  quarantine: number;
  agencyFee: number;
  clearance: number;
}

export interface PDAData {
  shipData: ShipData;
  costData: CostData;
}