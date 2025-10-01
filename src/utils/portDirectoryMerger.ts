// Utility functions for merging port directory data with deduplication

/**
 * Normalizes a string for comparison by:
 * - Trimming whitespace
 * - Collapsing multiple spaces into one
 * - Converting to lowercase
 * - Removing accents/diacritics
 */
export function normalizeForComparison(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Finds an existing key that matches the normalized input
 */
export function findExistingKey(newKey: string, existingKeys: string[]): string | null {
  const normalizedNew = normalizeForComparison(newKey);
  
  for (const existing of existingKeys) {
    if (normalizeForComparison(existing) === normalizedNew) {
      return existing;
    }
  }
  
  return null;
}

/**
 * Checks if a berth already exists in the list (case/accent insensitive)
 */
export function berthExists(newBerth: string, existingBerths: string[]): boolean {
  const normalizedNew = normalizeForComparison(newBerth);
  
  return existingBerths.some(existing => 
    normalizeForComparison(existing) === normalizedNew
  );
}

interface BerthInfo {
  berths: string[];
}

interface TerminalInfo {
  [terminalName: string]: BerthInfo;
}

interface PortInfo {
  terminals: TerminalInfo;
}

interface GlobalPortDirectory {
  [portName: string]: PortInfo;
}

/**
 * Merges new port directory data into existing directory
 * following the deduplication rules
 */
export function mergePortDirectory(
  existing: GlobalPortDirectory,
  newData: GlobalPortDirectory
): GlobalPortDirectory {
  const merged = { ...existing };
  
  // Process each new port
  for (const [newPortName, newPortData] of Object.entries(newData)) {
    // Find existing port key or use new one
    const existingPortKey = findExistingKey(newPortName, Object.keys(merged));
    const portKey = existingPortKey || newPortName;
    
    // Initialize port if it doesn't exist
    if (!merged[portKey]) {
      merged[portKey] = { terminals: {} };
    }
    
    // Process each terminal in the new port
    for (const [newTerminalName, newTerminalData] of Object.entries(newPortData.terminals)) {
      const existingTerminalKeys = Object.keys(merged[portKey].terminals);
      const existingTerminalKey = findExistingKey(newTerminalName, existingTerminalKeys);
      const terminalKey = existingTerminalKey || newTerminalName;
      
      // Initialize terminal if it doesn't exist
      if (!merged[portKey].terminals[terminalKey]) {
        merged[portKey].terminals[terminalKey] = { berths: [] };
      }
      
      // Process each berth in the new terminal
      for (const newBerth of newTerminalData.berths) {
        const existingBerths = merged[portKey].terminals[terminalKey].berths;
        
        // Only add berth if it doesn't already exist (normalized comparison)
        if (!berthExists(newBerth, existingBerths)) {
          existingBerths.push(newBerth);
        }
      }
      
      // Sort berths for consistency
      merged[portKey].terminals[terminalKey].berths.sort();
    }
  }
  
  return merged;
}