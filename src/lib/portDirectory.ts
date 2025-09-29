import { loadPortDirectoryGlobal, type PortDirectory, type BerthInfo, type TerminalInfo, type PortInfo } from "@/global/loader";

// Re-export types for compatibility
export type { BerthInfo, TerminalInfo, PortInfo, PortDirectory };

// Global port directory cache
let globalPortDirectory: PortDirectory | null = null;

// Load global port directory with fallback
const getPortDirectory = async (): Promise<PortDirectory> => {
  if (!globalPortDirectory) {
    globalPortDirectory = await loadPortDirectoryGlobal();
  }
  return globalPortDirectory;
};

export const getPortOptions = async () => {
  const portDirectory = await getPortDirectory();
  return Object.keys(portDirectory)
    .sort()
    .map(port => ({ value: port, label: port }));
};

export const getTerminalOptions = async (portName: string) => {
  const portDirectory = await getPortDirectory();
  const port = portDirectory[portName];
  if (!port) return [];
  
  return Object.keys(port.terminals)
    .sort()
    .map(terminal => ({ value: terminal, label: terminal }));
};

export const getBerthOptions = async (portName: string, terminalName: string) => {
  const portDirectory = await getPortDirectory();
  const port = portDirectory[portName];
  if (!port) return [];
  
  const terminal = port.terminals[terminalName];
  if (!terminal) return [];
  
  return terminal.berths
    .sort()
    .map(berth => ({ value: berth, label: berth }));
};

export const hasTerminals = async (portName: string): Promise<boolean> => {
  const portDirectory = await getPortDirectory();
  const port = portDirectory[portName];
  return port ? Object.keys(port.terminals).length > 0 : false;
};

export const hasBerths = async (portName: string, terminalName: string): Promise<boolean> => {
  const portDirectory = await getPortDirectory();
  const port = portDirectory[portName];
  if (!port) return false;
  
  const terminal = port.terminals[terminalName];
  return terminal ? terminal.berths.length > 0 : false;
};