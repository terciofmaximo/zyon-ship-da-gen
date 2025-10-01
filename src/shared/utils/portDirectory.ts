// Re-export the global port directory functions for backward compatibility
export { 
  getGlobalPortOptions as getPortOptions,
  getGlobalTerminalOptions as getTerminalOptions,
  getGlobalBerthOptions as getBerthOptions,
  hasGlobalTerminals as hasTerminals,
  hasGlobalBerths as hasBerths
} from "@/services/globalPortDirectory";