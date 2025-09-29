import { useState, useEffect } from "react";
import { getPortOptions, getTerminalOptions, getBerthOptions, hasTerminals, hasBerths } from "@/lib/portDirectory";

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
    portOptions: getPortOptions(),
    terminalOptions: [],
    berthOptions: [],
    showTerminalField: true,
    showBerthField: true,
    terminalDisabled: true,
    berthDisabled: true,
    terminalHint: "Selecione um Porto primeiro.",
    berthHint: "Selecione um Terminal primeiro."
  });

  const updatePortSelection = (port: string, onPortChange?: (port: string) => void, onTerminalChange?: (terminal: string) => void, onBerthChange?: (berth: string) => void) => {
    const newTerminalOptions = port ? getTerminalOptions(port) : [];
    const showTerminal = port ? hasTerminals(port) : false;
    
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
  };

  const updateTerminalSelection = (terminal: string, onTerminalChange?: (terminal: string) => void, onBerthChange?: (berth: string) => void) => {
    const newBerthOptions = state.selectedPort && terminal ? getBerthOptions(state.selectedPort, terminal) : [];
    const showBerth = state.selectedPort && terminal ? hasBerths(state.selectedPort, terminal) : false;
    
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
  };

  const updateBerthSelection = (berth: string, onBerthChange?: (berth: string) => void) => {
    setState(prev => ({
      ...prev,
      selectedBerth: berth
    }));

    onBerthChange?.(berth);
  };

  const initialize = (port: string = "", terminal: string = "", berth: string = "") => {
    if (port) {
      const terminalOptions = getTerminalOptions(port);
      const showTerminal = hasTerminals(port);
      
      let berthOptions: Array<{ value: string; label: string }> = [];
      let showBerth = true;
      let berthDisabled = true;
      let berthHint = "Selecione um Terminal primeiro.";
      
      if (terminal && showTerminal) {
        berthOptions = getBerthOptions(port, terminal);
        showBerth = hasBerths(port, terminal);
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