import { useState, useEffect } from "react";
import { 
  getPortOptions, 
  getTerminalOptions, 
  getBerthOptions, 
  hasTerminals, 
  hasBerths 
} from "@/lib/portDirectory";

interface PortDirectoryState {
  selectedPort: string;
  selectedTerminal: string;
  selectedBerth: string;
  portOptions: Array<{ value: string; label: string }>;
  terminalOptions: Array<{ value: string; label: string }>;
  berthOptions: Array<{ value: string; label: string }>;
  showTerminalField: boolean;
  showBerthField: boolean;
  terminalDisabled: boolean;
  berthDisabled: boolean;
  terminalHint: string;
  berthHint: string;
}

export function usePortDirectory() {
  const [state, setState] = useState<PortDirectoryState>({
    selectedPort: "",
    selectedTerminal: "",
    selectedBerth: "",
    portOptions: [],
    terminalOptions: [],
    berthOptions: [],
    showTerminalField: true,
    showBerthField: true,
    terminalDisabled: true,
    berthDisabled: true,
    terminalHint: "Selecione um Porto primeiro.",
    berthHint: "Selecione um Terminal primeiro."
  });

  // Load port options on mount
  useEffect(() => {
    const loadPortOptions = async () => {
      try {
        const options = await getPortOptions();
        setState(prev => ({
          ...prev,
          portOptions: options
        }));
      } catch (error) {
        console.warn("Failed to load port options:", error);
      }
    };
    loadPortOptions();
  }, []);

  const updatePortSelection = async (
    port: string, 
    onPortChange?: (port: string) => void, 
    onTerminalChange?: (terminal: string) => void, 
    onBerthChange?: (berth: string) => void
  ) => {
    if (port) {
      try {
        const [newTerminalOptions, showTerminal] = await Promise.all([
          getTerminalOptions(port),
          hasTerminals(port)
        ]);
        
        setState(prev => ({
          ...prev,
          selectedPort: port,
          selectedTerminal: "",
          selectedBerth: "",
          terminalOptions: newTerminalOptions,
          berthOptions: [],
          showTerminalField: showTerminal,
          showBerthField: true,
          terminalDisabled: !port || !showTerminal,
          berthDisabled: true,
          terminalHint: port 
            ? (showTerminal ? "" : "Este porto não possui terminais cadastrados.")
            : "Selecione um Porto primeiro.",
          berthHint: "Selecione um Terminal primeiro."
        }));
      } catch (error) {
        console.warn("Failed to load terminal options:", error);
        setState(prev => ({
          ...prev,
          selectedPort: port,
          selectedTerminal: "",
          selectedBerth: "",
          terminalOptions: [],
          berthOptions: [],
          showTerminalField: false,
          showBerthField: true,
          terminalDisabled: true,
          berthDisabled: true,
          terminalHint: "Erro ao carregar terminais.",
          berthHint: "Selecione um Terminal primeiro."
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        selectedPort: port,
        selectedTerminal: "",
        selectedBerth: "",
        terminalOptions: [],
        berthOptions: [],
        showTerminalField: true,
        showBerthField: true,
        terminalDisabled: true,
        berthDisabled: true,
        terminalHint: "Selecione um Porto primeiro.",
        berthHint: "Selecione um Terminal primeiro."
      }));
    }

    // Call the onChange handlers
    onPortChange?.(port);
    onTerminalChange?.("");
    onBerthChange?.("");
  };

  const updateTerminalSelection = async (
    terminal: string, 
    onTerminalChange?: (terminal: string) => void, 
    onBerthChange?: (berth: string) => void
  ) => {
    if (terminal && state.selectedPort) {
      try {
        const [newBerthOptions, showBerth] = await Promise.all([
          getBerthOptions(state.selectedPort, terminal),
          hasBerths(state.selectedPort, terminal)
        ]);
        
        setState(prev => ({
          ...prev,
          selectedTerminal: terminal,
          selectedBerth: "",
          berthOptions: newBerthOptions,
          showBerthField: showBerth,
          berthDisabled: !terminal || !showBerth,
          berthHint: terminal
            ? (showBerth ? "" : "Este terminal não possui berços cadastrados.")
            : "Selecione um Terminal primeiro."
        }));
      } catch (error) {
        console.warn("Failed to load berth options:", error);
        setState(prev => ({
          ...prev,
          selectedTerminal: terminal,
          selectedBerth: "",
          berthOptions: [],
          showBerthField: false,
          berthDisabled: true,
          berthHint: "Erro ao carregar berços."
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        selectedTerminal: terminal,
        selectedBerth: "",
        berthOptions: [],
        showBerthField: true,
        berthDisabled: true,
        berthHint: "Selecione um Terminal primeiro."
      }));
    }

    // Call the onChange handlers
    onTerminalChange?.(terminal);
    onBerthChange?.("");
  };

  const updateBerthSelection = (berth: string, onBerthChange?: (berth: string) => void) => {
    setState(prev => ({
      ...prev,
      selectedBerth: berth
    }));

    onBerthChange?.(berth);
  };

  const initialize = async (port: string = "", terminal: string = "", berth: string = "") => {
    if (port) {
      try {
        const [terminalOptions, showTerminal] = await Promise.all([
          getTerminalOptions(port),
          hasTerminals(port)
        ]);
        
        let berthOptions: Array<{ value: string; label: string }> = [];
        let showBerth = true;
        let berthDisabled = true;
        let berthHint = "Selecione um Terminal primeiro.";
        
        if (terminal && showTerminal) {
          const [newBerthOptions, hasBerthsResult] = await Promise.all([
            getBerthOptions(port, terminal),
            hasBerths(port, terminal)
          ]);
          berthOptions = newBerthOptions;
          showBerth = hasBerthsResult;
          berthDisabled = !showBerth;
          berthHint = showBerth ? "" : "Este terminal não possui berços cadastrados.";
        }
        
        setState(prev => ({
          ...prev,
          selectedPort: port,
          selectedTerminal: terminal,
          selectedBerth: berth,
          terminalOptions,
          berthOptions,
          showTerminalField: showTerminal,
          showBerthField: showBerth,
          terminalDisabled: !showTerminal,
          berthDisabled,
          terminalHint: showTerminal ? "" : "Este porto não possui terminais cadastrados.",
          berthHint
        }));
      } catch (error) {
        console.warn("Failed to initialize port directory:", error);
      }
    }
  };

  return {
    ...state,
    updatePortSelection,
    updateTerminalSelection,
    updateBerthSelection,
    initialize
  };
}