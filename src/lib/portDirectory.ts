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

export const PORT_DIRECTORY: PortDirectory = {
  "Santos": {
    terminals: {
      "ADM": { berths: ["39"] },
      "Alamoa": { berths: ["ALA 1", "ALA 1,2", "ALA 2", "ALA 2,3,4", "ALA 3", "ALA 4"] },
      "CLI": { berths: ["16/17", "19"] },
      "Commercial Quay": { berths: ["351", "352", "12A", "25", "29/30", "29A", "31", "32", "33", "34", "Outeirinhos 02", "Outeirinhos 03", "TEC II"] },
      "Copersucar": { berths: ["20/21"] },
      "Cutrale": { berths: ["Cutrale"] },
      "Dow Química": { berths: ["Dow Química"] },
      "DP World": { berths: ["DPW 2", "DPW 3", "DPW 4"] },
      "Ecoporto": { berths: ["Corte", "CS 4", "Valongo"] },
      "Export Corridor": { berths: ["Terminal XXXIX", "TES"] },
      "Hidrovias do Brasil": { berths: ["HBSA  Shed 23"] },
      "Ilha Barnabé": { berths: ["IB Ageo", "IB BC", "IB SP", "IBOE", "TBC"] },
      "Saboo": { berths: ["CS 1", "CS 2", "CS 3"] },
      "Santos Brasil": { berths: ["Tecon 1"] },
      "TEAG": { berths: ["TEAG"] },
      "TEG": { berths: ["Cargill 2"] },
      "Termag": { berths: ["TMG"] },
      "Terminal Export Cofco": { berths: ["TEC I", "TEC II"] },
      "TEV": { berths: ["TEV"] },
      "TGG": { berths: ["01"] },
      "Tiplam": { berths: ["Tiplam Berth 1", "Tiplam Berth 2", "Tiplam Berth 3", "Tiplam Berth 4"] },
      "Usiminas": { berths: ["COS 2", "COS 3", "COS 4"] }
    }
  },
  "Vitória": {
    terminals: {
      "Anchorage Area": { berths: ["Anchorage Area"] },
      "Jurong": { berths: ["South Quay Extension"] },
      "PEIU": { berths: ["206"] },
      "Samarco  Ponta Ubu": { berths: ["East Side", "Terminal de Cargas Diversas", "West Side"] },
      "Terminal da Ilha do Principe (FLEXIBRAS)": { berths: ["906"] },
      "Terminal de Barra do Riacho  PETROBRAS": { berths: ["BR501", "BR502"] },
      "Terminal de Barra do Riacho  PORTOCEL": { berths: ["1", "2", "3"] },
      "Terminal de Graneis Liquidos": { berths: ["5"] },
      "Terminal de Praia Mole  TPM": { berths: ["CV1", "CV2"] },
      "Terminal de Praia Mole Steel  TPS": { berths: ["S  1", "S  2", "S  3"] },
      "Terminal de Vila Velha  TVV": { berths: ["203", "204"] },
      "Terminal do Aribiri CPVV": { berths: ["903"] },
      "Terminal Zemax": { berths: ["909"] },
      "TPD": { berths: ["3", "4"] },
      "Tubarão Iron Ore Complex": { berths: ["Pier 1 North Side", "Pier 1 South Side", "Pier 2"] },
      "VPORTS  Cais Comercial": { berths: ["101", "102", "103"] },
      "VPORTS  Capuaba": { berths: ["201", "202", "207"] },
      "VPORTS  Paul": { berths: ["905"] }
    }
  }
};

export const getPortOptions = () => {
  return Object.keys(PORT_DIRECTORY)
    .sort()
    .map(port => ({ value: port, label: port }));
};

export const getTerminalOptions = (portName: string) => {
  const port = PORT_DIRECTORY[portName];
  if (!port) return [];
  
  return Object.keys(port.terminals)
    .sort()
    .map(terminal => ({ value: terminal, label: terminal }));
};

export const getBerthOptions = (portName: string, terminalName: string) => {
  const port = PORT_DIRECTORY[portName];
  if (!port) return [];
  
  const terminal = port.terminals[terminalName];
  if (!terminal) return [];
  
  return terminal.berths
    .sort()
    .map(berth => ({ value: berth, label: berth }));
};

export const hasTerminals = (portName: string): boolean => {
  const port = PORT_DIRECTORY[portName];
  return port ? Object.keys(port.terminals).length > 0 : false;
};

export const hasBerths = (portName: string, terminalName: string): boolean => {
  const port = PORT_DIRECTORY[portName];
  if (!port) return false;
  
  const terminal = port.terminals[terminalName];
  return terminal ? terminal.berths.length > 0 : false;
};