import { toast } from "@/hooks/use-toast";
import { GLOBAL_BASE_VERSION } from "./constants";

// Global data interfaces
export interface BerthInfo {
  berths: string[];
}

export interface TerminalInfo {
  [terminalName: string]: BerthInfo;
}

export interface PortInfo {
  terminals: TerminalInfo;
}

export interface PortDirectory {
  [portName: string]: PortInfo;
}

export interface ShipTypeRange {
  dwt: [number, number];
  loa: [number, number];
  beam: [number, number];
  draft: [number, number];
}

export interface ShipTypeRanges {
  [shipType: string]: ShipTypeRange;
}

// Cache management
let portDirectoryCache: PortDirectory | null = null;
let shipTypeRangesCache: ShipTypeRanges | null = null;
let cacheVersion: string | null = null;

const shouldRefreshCache = (): boolean => {
  return cacheVersion !== GLOBAL_BASE_VERSION;
};

// Port Directory Global Loader
export const loadPortDirectoryGlobal = async (): Promise<PortDirectory> => {
  if (portDirectoryCache && !shouldRefreshCache()) {
    return portDirectoryCache;
  }

  try {
    const response = await fetch('/src/global/data/portDirectory.global.json');
    if (!response.ok) {
      throw new Error(`Failed to load port directory: ${response.statusText}`);
    }
    
    const data = await response.json();
    portDirectoryCache = data;
    cacheVersion = GLOBAL_BASE_VERSION;
    
    return data;
  } catch (error) {
    console.warn('Failed to load global port directory:', error);
    toast({
      title: "Base global indisponível",
      description: "Não foi possível carregar o diretório de portos. Os campos serão temporariamente limitados.",
      variant: "destructive",
    });
    
    // Return empty directory as fallback
    return {};
  }
};

// Ship Type Ranges Global Loader
export const loadShipTypeRangesGlobal = async (): Promise<ShipTypeRanges> => {
  if (shipTypeRangesCache && !shouldRefreshCache()) {
    return shipTypeRangesCache;
  }

  try {
    const response = await fetch('/src/global/data/shipTypeRanges.global.json');
    if (!response.ok) {
      throw new Error(`Failed to load ship type ranges: ${response.statusText}`);
    }
    
    const data = await response.json();
    shipTypeRangesCache = data;
    cacheVersion = GLOBAL_BASE_VERSION;
    
    return data;
  } catch (error) {
    console.warn('Failed to load global ship type ranges:', error);
    toast({
      title: "Base global indisponível",
      description: "Não foi possível carregar os ranges de navios. Os campos serão temporariamente limitados.",
      variant: "destructive",
    });
    
    // Return empty ranges as fallback
    return {};
  }
};

// Global Constants Loader (already available as static imports)
export const loadGlobalConstants = () => {
  // Constants are already available as static imports
  return import('./constants');
};

// Utility function to clear cache (for platform admins)
export const clearGlobalCache = (): void => {
  portDirectoryCache = null;
  shipTypeRangesCache = null;
  cacheVersion = null;
};

// Health check for global data
export const checkGlobalDataHealth = async (): Promise<boolean> => {
  try {
    const [portDirectory, shipTypeRanges] = await Promise.all([
      loadPortDirectoryGlobal(),
      loadShipTypeRangesGlobal()
    ]);
    
    return Object.keys(portDirectory).length > 0 && Object.keys(shipTypeRanges).length > 0;
  } catch (error) {
    console.warn('Global data health check failed:', error);
    return false;
  }
};