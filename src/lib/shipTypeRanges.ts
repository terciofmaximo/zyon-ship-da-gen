export interface ShipTypeRange {
  dwt: [number, number];
  loa: [number, number];
  beam: [number, number];
  draft: [number, number];
}

export const SHIP_TYPE_RANGES: Record<string, ShipTypeRange> = {
  "Handysize": { 
    dwt: [10000, 39999], 
    loa: [130, 180], 
    beam: [20, 28], 
    draft: [9.0, 10.5] 
  },
  "Handymax": { 
    dwt: [40000, 49999], 
    loa: [180, 200], 
    beam: [28, 32], 
    draft: [11.0, 12.0] 
  },
  "Supramax": { 
    dwt: [50000, 59999], 
    loa: [180, 200], 
    beam: [30, 32], 
    draft: [12.0, 13.0] 
  },
  "Panamax": { 
    dwt: [60000, 82000], 
    loa: [215, 230], 
    beam: [32.0, 32.3], 
    draft: [12.0, 13.0] 
  },
  "Kamsarmax": { 
    dwt: [82001, 85000], 
    loa: [225, 235], 
    beam: [32.0, 32.3], 
    draft: [13.5, 14.5] 
  },
  "Post-Panamax": { 
    dwt: [85001, 120000], 
    loa: [260, 290], 
    beam: [36, 40], 
    draft: [14.5, 15.5] 
  },
  "Capesize": {
    dwt: [150000, 199999], 
    loa: [280, 300], 
    beam: [45, 50], 
    draft: [17.0, 18.0] 
  },
  "Valemax": { 
    dwt: [380000, 400000], 
    loa: [360, 362], 
    beam: [65, 65], 
    draft: [23.0, 23.0] 
  },
  "Coastal Tanker": { 
    dwt: [5000, 40000], 
    loa: [100, 180], 
    beam: [15, 30], 
    draft: [8.0, 11.0] 
  },
  "Aframax": { 
    dwt: [80000, 119999], 
    loa: [245, 255], 
    beam: [42, 44], 
    draft: [14.0, 15.0] 
  },
  "Suezmax": { 
    dwt: [120000, 199999], 
    loa: [270, 285], 
    beam: [48, 48], 
    draft: [16.0, 17.0] 
  },
  "VLCC": { 
    dwt: [200000, 320000], 
    loa: [330, 340], 
    beam: [58, 62], 
    draft: [20.0, 22.0] 
  },
  "ULCC": { 
    dwt: [320000, 550000], 
    loa: [380, 415], 
    beam: [68, 70], 
    draft: [24.0, 25.0] 
  }
};

export function getShipTypeFromName(vesselName: string): string | null {
  const shipTypes = Object.keys(SHIP_TYPE_RANGES);
  return shipTypes.find(type => vesselName.toLowerCase().includes(type.toLowerCase())) || null;
}

export function calculateMeanValue(range: [number, number]): number {
  return Math.round(((range[0] + range[1]) / 2) * 100) / 100;
}

export function isValueInRange(value: number, range: [number, number]): boolean {
  return value >= range[0] && value <= range[1];
}

export function formatRange(range: [number, number], unit: string): string {
  return `Range: ${range[0].toLocaleString()} – ${range[1].toLocaleString()} ${unit}`;
}