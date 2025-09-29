import { loadShipTypeRangesGlobal, type ShipTypeRanges, type ShipTypeRange } from "@/global/loader";

// Re-export types for compatibility
export type { ShipTypeRange, ShipTypeRanges };

// Global ship type ranges cache
let globalShipTypeRanges: ShipTypeRanges | null = null;

// Load global ship type ranges with fallback
const loadShipTypeRangesInternal = async (): Promise<ShipTypeRanges> => {
  if (!globalShipTypeRanges) {
    globalShipTypeRanges = await loadShipTypeRangesGlobal();
  }
  return globalShipTypeRanges;
};

export async function getShipTypeFromName(vesselName: string): Promise<string | null> {
  const shipTypeRanges = await loadShipTypeRangesInternal();
  const shipTypes = Object.keys(shipTypeRanges);
  return shipTypes.find(type => vesselName.toLowerCase().includes(type.toLowerCase())) || null;
}

// Utility functions remain synchronous as they don't depend on the ranges
export function calculateMeanValue(range: [number, number]): number {
  return Math.round(((range[0] + range[1]) / 2) * 100) / 100;
}

export function isValueInRange(value: number, range: [number, number]): boolean {
  return value >= range[0] && value <= range[1];
}

export function formatRange(range: [number, number], unit: string): string {
  return `Range: ${range[0].toLocaleString()} – ${range[1].toLocaleString()} ${unit}`;
}

// New async functions that use global data
export async function getShipTypeRanges(): Promise<ShipTypeRanges> {
  return loadShipTypeRangesInternal();
}

export async function getShipTypeRange(shipType: string): Promise<ShipTypeRange | null> {
  const ranges = await loadShipTypeRangesInternal();
  return ranges[shipType] || null;
}