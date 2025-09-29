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

let globalPortDirectoryCache: GlobalPortDirectory | null = null;

/**
 * Invalidates the cache to force reload of port directory data
 */
export const invalidatePortDirectoryCache = (): void => {
  globalPortDirectoryCache = null;
};

export const loadGlobalPortDirectory = async (): Promise<GlobalPortDirectory> => {
  if (globalPortDirectoryCache) {
    return globalPortDirectoryCache;
  }

  try {
    const response = await fetch('/data/portDirectory.global.json');
    if (!response.ok) {
      throw new Error(`Failed to load global port directory: ${response.statusText}`);
    }
    
    const data = await response.json();
    globalPortDirectoryCache = data;
    return data;
  } catch (error) {
    console.warn('Failed to load global port directory:', error);
    throw error;
  }
};

export const getGlobalPortOptions = async () => {
  try {
    const directory = await loadGlobalPortDirectory();
    return Object.keys(directory)
      .sort()
      .map(port => ({ value: port, label: port }));
  } catch (error) {
    console.warn('Error getting port options:', error);
    return [];
  }
};

export const getGlobalTerminalOptions = async (portName: string) => {
  try {
    const directory = await loadGlobalPortDirectory();
    const port = directory[portName];
    if (!port) return [];
    
    return Object.keys(port.terminals)
      .sort()
      .map(terminal => ({ value: terminal, label: terminal }));
  } catch (error) {
    console.warn('Error getting terminal options:', error);
    return [];
  }
};

export const getGlobalBerthOptions = async (portName: string, terminalName: string) => {
  try {
    const directory = await loadGlobalPortDirectory();
    const port = directory[portName];
    if (!port) return [];
    
    const terminal = port.terminals[terminalName];
    if (!terminal) return [];
    
    return terminal.berths
      .sort()
      .map(berth => ({ value: berth, label: berth }));
  } catch (error) {
    console.warn('Error getting berth options:', error);
    return [];
  }
};

export const hasGlobalTerminals = async (portName: string): Promise<boolean> => {
  try {
    const directory = await loadGlobalPortDirectory();
    const port = directory[portName];
    return port ? Object.keys(port.terminals).length > 0 : false;
  } catch (error) {
    console.warn('Error checking terminals:', error);
    return false;
  }
};

export const hasGlobalBerths = async (portName: string, terminalName: string): Promise<boolean> => {
  try {
    const directory = await loadGlobalPortDirectory();
    const port = directory[portName];
    if (!port) return false;
    
    const terminal = port.terminals[terminalName];
    return terminal ? terminal.berths.length > 0 : false;
  } catch (error) {
    console.warn('Error checking berths:', error);
    return false;
  }
};