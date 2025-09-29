// Itaqui Port Tariff Data Structure
// Based on acceptance test cases and berth grouping requirements

export interface TariffBracket {
  min: number;
  max: number;
  usd: number;
}

export interface TariffGroup {
  name: string;
  berths: number[];
  table: TariffBracket[];
}

// Pilotage berth groups
export const PILOTAGE_GROUPS: TariffGroup[] = [
  {
    name: "Berths 99–104",
    berths: [99, 100, 101, 102, 103, 104],
    table: [
      { min: 0, max: 1000, usd: 6389.79 },
      { min: 1001, max: 10000, usd: 8500.00 },
      { min: 10001, max: 20000, usd: 12000.00 },
      { min: 20001, max: 40000, usd: 15500.00 },
      { min: 40001, max: 70000, usd: 19769.48 },
      { min: 70001, max: 100000, usd: 25000.00 },
      { min: 100001, max: Infinity, usd: 32000.00 }
    ]
  },
  {
    name: "Berths 106 & 108",
    berths: [106, 108],
    table: [
      { min: 0, max: 1000, usd: 8906.70 },
      { min: 1001, max: 10000, usd: 12500.00 },
      { min: 10001, max: 20000, usd: 16800.00 },
      { min: 20001, max: 40000, usd: 22500.00 },
      { min: 40001, max: 70000, usd: 28000.00 },
      { min: 70001, max: 100000, usd: 34401.60 },
      { min: 100001, max: Infinity, usd: 42000.00 }
    ]
  }
];

// Towage tariffs (single table for all berths)
export const TOWAGE_TABLE: TariffBracket[] = [
  { min: 0, max: 1000, usd: 13684.00 },
  { min: 1001, max: 10000, usd: 18500.00 },
  { min: 10001, max: 20000, usd: 25600.00 },
  { min: 20001, max: 40000, usd: 35800.00 },
  { min: 40001, max: 70000, usd: 45632.00 },
  { min: 70001, max: 100000, usd: 49421.00 },
  { min: 100001, max: Infinity, usd: 58000.00 }
];

// Light dues tariffs
export const LIGHT_DUES_TABLE: TariffBracket[] = [
  { min: 0, max: 999, usd: 0.00 },
  { min: 1000, max: 50000, usd: 1500.00 },
  { min: 50001, max: 100000, usd: 2250.00 },
  { min: 100001, max: Infinity, usd: 3000.00 }
];

// Helper function to pick bracket based on DWT
export function pickBracket(dwt: number, rows: TariffBracket[]): TariffBracket {
  for (const r of rows) {
    if (dwt >= r.min && dwt <= r.max) return r;
  }
  // Clamp to nearest edge if out of range
  return dwt > rows[rows.length - 1].max ? rows[rows.length - 1] : rows[0];
}

// Helper function to normalize berth numbers
export function normalizeBerth(berth: string): number {
  return parseInt(berth.replace(/^0+/, ''), 10) || 0;
}

// Get pilotage group for selected berths
export function getPilotageGroup(berths: string[]): TariffGroup | null {
  if (!berths || berths.length === 0) return null;
  
  const normalizedBerths = berths.map(normalizeBerth);
  
  // Check if any berth is in the higher rate group (106, 108)
  const hasHighRateGroup = normalizedBerths.some(b => [106, 108].includes(b));
  if (hasHighRateGroup) {
    return PILOTAGE_GROUPS[1]; // "Berths 106 & 108"
  }
  
  // Check if any berth is in the standard group (99-104)
  const hasStandardGroup = normalizedBerths.some(b => [99, 100, 101, 102, 103, 104].includes(b));
  if (hasStandardGroup) {
    return PILOTAGE_GROUPS[0]; // "Berths 99–104"
  }
  
  return null;
}

// Helper to convert numbers with locale formatting
export const toNum = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const normalized = v.replace(/\./g, "").replace(",", ".").trim();
    const num = Number(normalized);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};