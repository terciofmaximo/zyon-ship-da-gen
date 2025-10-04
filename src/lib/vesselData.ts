export interface VesselType {
  classification: string;
  type: 'Bulk Carrier' | 'Motor Tanker';
  minDwt: number;
  maxDwt: number;
  loa: number;
  beam: number;
  draft: number;
}

export const VESSEL_TYPES: VesselType[] = [
  {
    classification: 'MV Handymax TBN',
    type: 'Bulk Carrier',
    minDwt: 35000,
    maxDwt: 50000,
    loa: 150,
    beam: 30,
    draft: 10,
  },
  {
    classification: 'MV Panamax TBN',
    type: 'Bulk Carrier',
    minDwt: 65000,
    maxDwt: 82000,
    loa: 294,
    beam: 32.3,
    draft: 12,
  },
  {
    classification: 'MV Kamsarmax TBN',
    type: 'Bulk Carrier',
    minDwt: 82001,
    maxDwt: 85000,
    loa: 230,
    beam: 32.2,
    draft: 14,
  },
  {
    classification: 'MV Post-Panamax TBN',
    type: 'Bulk Carrier',
    minDwt: 85001,
    maxDwt: 120000,
    loa: 275,
    beam: 38,
    draft: 15,
  },
  {
    classification: 'MV Capesize TBN',
    type: 'Bulk Carrier',
    minDwt: 170000,
    maxDwt: 180000,
    loa: 290,
    beam: 45,
    draft: 18,
  },
  {
    classification: 'MV Valemax TBN',
    type: 'Bulk Carrier',
    minDwt: 320000,
    maxDwt: 400000,
    loa: 360,
    beam: 65,
    draft: 25,
  },
  {
    classification: 'MT Coastal Tanker',
    type: 'Motor Tanker',
    minDwt: 1000,
    maxDwt: 50000,
    loa: 205,
    beam: 29,
    draft: 16,
  },
  {
    classification: 'MT Aframax',
    type: 'Motor Tanker',
    minDwt: 80000,
    maxDwt: 120000,
    loa: 245,
    beam: 34,
    draft: 20,
  },
  {
    classification: 'MT Suezmax',
    type: 'Motor Tanker',
    minDwt: 125000,
    maxDwt: 180000,
    loa: 285,
    beam: 45,
    draft: 23,
  },
  {
    classification: 'MT VLCC',
    type: 'Motor Tanker',
    minDwt: 200000,
    maxDwt: 320000,
    loa: 330,
    beam: 55,
    draft: 28,
  },
  {
    classification: 'MT ULCC',
    type: 'Motor Tanker',
    minDwt: 320000,
    maxDwt: 550000,
    loa: 415,
    beam: 63,
    draft: 35,
  },
];