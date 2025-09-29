import { useState, useEffect } from "react";
import { getGlobalPortOptions, getGlobalTerminalOptions, getGlobalBerthOptions, hasGlobalTerminals, hasGlobalBerths } from "@/services/globalPortDirectory";

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

  // Load initial port options
  useEffect(() => {
    const loadPorts = async () => {
      try {
        const ports = await getGlobalPortOptions();
        setState(prev => ({ ...prev, portOptions: ports }));
      } catch (error) {
        console.error("Failed to load port options:", error);
      }
    };
    loadPorts();
  }, []);

  const updatePortSelection = async (port: string, onPortChange?: (port: string) => void, onTerminalChange?: (terminal: string) => void, onBerthChange?: (berth: string) => void) => {
    try {
      const newTerminalOptions = port ? await getGlobalTerminalOptions(port) : [];
      const showTerminal = port ? await hasGlobalTerminals(port) : false;
      
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

      // Call the onChange handlers
      onPortChange?.(port);
      onTerminalChange?.("");
      onBerthChange?.("");
    } catch (error) {
      console.error("Error updating port selection:", error);
    }
  };

  const updateTerminalSelection = async (terminal: string, onTerminalChange?: (terminal: string) => void, onBerthChange?: (berth: string) => void) => {
    try {
      const newBerthOptions = state.selectedPort && terminal ? await getGlobalBerthOptions(state.selectedPort, terminal) : [];
      const showBerth = state.selectedPort && terminal ? await hasGlobalBerths(state.selectedPort, terminal) : false;
      
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

      // Call the onChange handlers
      onTerminalChange?.(terminal);
      onBerthChange?.("");
    } catch (error) {
      console.error("Error updating terminal selection:", error);
    }
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
        const terminalOptions = await getGlobalTerminalOptions(port);
        const showTerminal = await hasGlobalTerminals(port);
        
        let berthOptions: Array<{ value: string; label: string }> = [];
        let showBerth = true;
        let berthDisabled = true;
        let berthHint = "Selecione um Terminal primeiro.";
        
        if (terminal && showTerminal) {
          berthOptions = await getGlobalBerthOptions(port, terminal);
          showBerth = await hasGlobalBerths(port, terminal);
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
        console.error("Error initializing port directory:", error);
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