import { useCallback, useEffect, useState } from 'react';
import { 
  PILOTAGE_GROUPS, 
  TOWAGE_TABLE, 
  LIGHT_DUES_TABLE, 
  pickBracket, 
  getPilotageGroup,
  toNum,
  type TariffBracket,
  type TariffGroup
} from '@/data/itaquiTariffs';
import type { CostData } from '@/types';

export interface AutoPricingMeta {
  port: string;
  terminal: string;
  group?: string;
  bracket?: TariffBracket;
  isAuto: boolean;
}

export interface AutoPricingState {
  costs: Partial<CostData>;
  meta: Record<keyof Pick<CostData, 'pilotageIn' | 'towageIn' | 'lightDues'>, AutoPricingMeta>;
  warnings: string[];
}

interface UseItaquiAutoPricingProps {
  port: string;
  terminal: string;
  berths: string[];
  dwt: string;
  exchangeRate: string;
  onCostsUpdate?: (costs: Partial<CostData>, meta: AutoPricingState['meta']) => void;
}

export function useItaquiAutoPricing({
  port,
  terminal,
  berths,
  dwt,
  exchangeRate,
  onCostsUpdate
}: UseItaquiAutoPricingProps) {
  const [autoPricingState, setAutoPricingState] = useState<AutoPricingState>({
    costs: {},
    meta: {
      pilotageIn: { port: '', terminal: '', isAuto: false },
      towageIn: { port: '', terminal: '', isAuto: false },
      lightDues: { port: '', terminal: '', isAuto: false }
    },
    warnings: []
  });

  // Function to calculate auto prices
  const calculatePrices = useCallback(() => {
    const isItaqui = port === "Itaqui" && terminal === "Itaqui";
    
    if (!isItaqui) {
      // Clear auto pricing for other ports
      setAutoPricingState({
        costs: {},
        meta: {
          pilotageIn: { port: '', terminal: '', isAuto: false },
          towageIn: { port: '', terminal: '', isAuto: false },
          lightDues: { port: '', terminal: '', isAuto: false }
        },
        warnings: []
      });
      return;
    }

    const dwtValue = toNum(dwt);
    const exchangeRateValue = toNum(exchangeRate);
    
    if (!dwtValue || dwtValue <= 0) {
      setAutoPricingState(prev => ({
        ...prev,
        warnings: ["Enter vessel DWT to auto-calculate Itaqui tariffs."]
      }));
      return;
    }

    const newCosts: Partial<CostData> = {};
    const newMeta: AutoPricingState['meta'] = {
      pilotageIn: { port: '', terminal: '', isAuto: false },
      towageIn: { port: '', terminal: '', isAuto: false },
      lightDues: { port: '', terminal: '', isAuto: false }
    };
    const warnings: string[] = [];

    // Pilotage calculation
    const pilotageGroup = getPilotageGroup(berths);
    if (pilotageGroup) {
      const pilotBracket = pickBracket(dwtValue, pilotageGroup.table);
      const pilotageUSD = pilotBracket.usd;
      
      newCosts.pilotageIn = pilotageUSD;
      newMeta.pilotageIn = {
        port: "Itaqui",
        terminal: "Itaqui",
        group: pilotageGroup.name,
        bracket: pilotBracket,
        isAuto: true
      };

      // Check for multiple berth groups
      const hasMultipleGroups = berths.some(b => getPilotageGroup([b])?.name !== pilotageGroup.name);
      if (hasMultipleGroups) {
        warnings.push("Multiple berths selected; using highest pilotage group.");
      }
    } else if (berths.length > 0) {
      warnings.push("Pilotage tariff not set for selected berth(s) at Itaqui.");
    }

    // Towage calculation
    const towageBracket = pickBracket(dwtValue, TOWAGE_TABLE);
    const towageUSD = towageBracket.usd;
    
    newCosts.towageIn = towageUSD;
    newMeta.towageIn = {
      port: "Itaqui",
      terminal: "Itaqui",
      group: "Standard Towage",
      bracket: towageBracket,
      isAuto: true
    };

    // Light dues calculation
    const lightDuesBracket = pickBracket(dwtValue, LIGHT_DUES_TABLE);
    const lightDuesUSD = lightDuesBracket.usd;
    
    newCosts.lightDues = lightDuesUSD;
    newMeta.lightDues = {
      port: "Itaqui",
      terminal: "Itaqui",
      group: "Light Dues",
      bracket: lightDuesBracket,
      isAuto: true
    };

    setAutoPricingState({
      costs: newCosts,
      meta: newMeta,
      warnings
    });

    // Notify parent component
    onCostsUpdate?.(newCosts, newMeta);

  }, [port, terminal, berths, dwt, exchangeRate, onCostsUpdate]);

  // Recalculate when dependencies change
  useEffect(() => {
    calculatePrices();
  }, [calculatePrices]);

  // Function to disable auto-pricing for a specific item
  const disableAutoPricing = useCallback((costItem: keyof Pick<CostData, 'pilotageIn' | 'towageIn' | 'lightDues'>) => {
    setAutoPricingState(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        [costItem]: {
          ...prev.meta[costItem],
          isAuto: false
        }
      }
    }));
  }, []);

  // Function to get hint text for auto-filled items
  const getHintText = useCallback((costItem: keyof Pick<CostData, 'pilotageIn' | 'towageIn' | 'lightDues'>): string => {
    const itemMeta = autoPricingState.meta[costItem];
    if (!itemMeta.isAuto) return '';
    
    const dwtValue = toNum(dwt);
    const groupName = itemMeta.group || '';
    
    return `Auto-filled for Itaqui (DWT ${dwtValue.toLocaleString()}, ${groupName}).`;
  }, [autoPricingState.meta, dwt]);

  return {
    autoPricingState,
    disableAutoPricing,
    getHintText,
    recalculate: calculatePrices
  };
}