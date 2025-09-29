import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FDA, FDALedger, FDAWithLedger, FDATotals } from "@/types/fda";
import Decimal from "decimal.js";

// Cost item mapping for PDA to FDA conversion
const COST_ITEM_MAPPING = {
  pilotage_in: "Pilot IN/OUT",
  towage_in: "Towage IN/OUT", 
  light_dues: "Light dues",
  dockage: "Dockage (Wharfage)",
  linesman: "Linesman (mooring/unmooring)",
  launch_boat: "Launch boat (mooring/unmooring)",
  immigration: "Immigration tax (Funapol)",
  free_pratique: "Free pratique tax",
  shipping_association: "Shipping association",
  clearance: "Clearance",
  paperless_port: "Paperless Port System",
  agency_fee: "Agency fee",
  waterway: "Waterway channel (Table I)",
};

export const useFDA = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const convertPdaToFda = async (pdaId: string): Promise<string | null> => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Authentication required");
      }

      // Fetch PDA data
      const { data: pda, error: pdaError } = await supabase
        .from("pdas")
        .select("*")
        .eq("id", pdaId)
        .single();

      if (pdaError) throw pdaError;

      // Check if FDA already exists for this PDA
      const { data: existingFda } = await supabase
        .from("fda")
        .select("id")
        .eq("pda_id", pdaId)
        .maybeSingle();

      if (existingFda) {
        toast({
          title: "FDA Already Exists",
          description: `FDA already created for PDA ${pda.pda_number}. Redirecting to existing FDA.`,
          variant: "destructive",
        });
        return existingFda.id;
      }

      // Create FDA header
      const fdaData = {
        pda_id: pdaId,
        status: "Draft" as const,
        client_name: pda.to_display_name,
        client_id: pda.to_client_id,
        vessel_name: pda.vessel_name,
        imo: pda.imo_number,
        port: pda.port_name,
        terminal: pda.berth,
        currency_base: "USD",
        currency_local: "BRL",
        exchange_rate: parseFloat(pda.exchange_rate || "5.25"),
        created_by: user.id,
        tenant_id: pda.tenant_id, // Copy tenant_id from PDA
        meta: {
          originalPdaNumber: pda.pda_number,
          conversionDate: new Date().toISOString(),
        },
      };

      const { data: newFda, error: fdaError } = await supabase
        .from("fda")
        .insert(fdaData)
        .select()
        .single();

      if (fdaError) throw fdaError;

      // Create ledger entries
      const ledgerEntries: Omit<FDALedger, "id" | "created_at" | "updated_at">[] = [];
      let lineNo = 1;

      // Process each cost item from PDA - create single line per item
      Object.entries(COST_ITEM_MAPPING).forEach(([pdaField, category]) => {
        const amount = parseFloat(pda[pdaField] || "0");
        if (amount <= 0) return;

        const exchangeRate = new Decimal(fdaData.exchange_rate);
        const amountUSD = new Decimal(amount);
        const amountLocal = amountUSD.mul(exchangeRate);

        // Side mapping: Agency fee → AR, everything else → AP
        const side: "AP" | "AR" = category === "Agency fee" ? "AR" : "AP";

        ledgerEntries.push({
          fda_id: newFda.id,
          line_no: lineNo++,
          side,
          category,
          description: category,
          counterparty: side === "AP" 
            ? "Vendor — to assign" 
            : (pda.to_display_name || "Client"),
          amount_usd: amountUSD.toNumber(),
          amount_local: amountLocal.toNumber(),
          status: "Open",
          tenant_id: pda.tenant_id, // Copy tenant_id from PDA
          source: {
            pdaField,
            originalAmount: amount,
            exchangeRate: fdaData.exchange_rate,
            pda_item_id: pdaField, // Track source PDA field
            // Preserve Itaqui auto-pricing metadata if present
            ...(pda.comments?.[pdaField] || {}),
          },
        });
      });

      if (ledgerEntries.length > 0) {
        const { error: ledgerError } = await supabase
          .from("fda_ledger")
          .insert(ledgerEntries);

        if (ledgerError) throw ledgerError;
      }

      toast({
        title: "Success",
        description: `FDA created from PDA ${pda.pda_number}`,
      });

      return newFda.id;
    } catch (error) {
      console.error("Error converting PDA to FDA:", error);
      toast({
        title: "Error",
        description: "Failed to create FDA. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getFDA = async (id: string): Promise<FDAWithLedger | null> => {
    try {
      const { data: fda, error: fdaError } = await supabase
        .from("fda")
        .select("*")
        .eq("id", id)
        .single();

      if (fdaError) throw fdaError;

      const { data: ledger, error: ledgerError } = await supabase
        .from("fda_ledger")
        .select("*")
        .eq("fda_id", id)
        .order("line_no");

      if (ledgerError) throw ledgerError;

      return {
        ...fda,
        ledger: ledger || [],
      };
    } catch (error) {
      console.error("Error fetching FDA:", error);
      toast({
        title: "Error",
        description: "Failed to load FDA",
        variant: "destructive",
      });
      return null;
    }
  };

  const rebuildFromPda = async (fdaId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Get FDA and its linked PDA
      const { data: fda, error: fdaError } = await supabase
        .from("fda")
        .select("*, pda:pda_id(*)")
        .eq("id", fdaId)
        .single();

      if (fdaError) throw fdaError;

      // Only allow rebuild for Draft status
      if (fda.status !== "Draft") {
        toast({
          title: "Cannot Rebuild",
          description: "Can only rebuild FDA in Draft status",
          variant: "destructive",
        });
        return false;
      }

      // Delete existing ledger entries
      const { error: deleteError } = await supabase
        .from("fda_ledger")
        .delete()
        .eq("fda_id", fdaId);

      if (deleteError) throw deleteError;

      // Recreate ledger from current PDA values
      const pda = (fda as any).pda;
      const ledgerEntries: Omit<FDALedger, "id" | "created_at" | "updated_at">[] = [];
      let lineNo = 1;

      Object.entries(COST_ITEM_MAPPING).forEach(([pdaField, category]) => {
        const amount = parseFloat(pda[pdaField] || "0");
        if (amount <= 0) return;

        const exchangeRate = new Decimal(fda.exchange_rate || 5.25);
        const amountUSD = new Decimal(amount);
        const amountLocal = amountUSD.mul(exchangeRate);

        // Side mapping: Agency fee → AR, everything else → AP
        const side: "AP" | "AR" = category === "Agency fee" ? "AR" : "AP";

        ledgerEntries.push({
          fda_id: fdaId,
          line_no: lineNo++,
          side,
          category,
          description: category,
          counterparty: side === "AP" 
            ? "Vendor — to assign" 
            : (fda.client_name || "Client"),
          amount_usd: amountUSD.toNumber(),
          amount_local: amountLocal.toNumber(),
          status: "Open",
          tenant_id: fda.tenant_id, // Copy tenant_id from FDA
          source: {
            pdaField,
            originalAmount: amount,
            exchangeRate: fda.exchange_rate,
            pda_item_id: pdaField, // Track source PDA field
          },
        });
      });

      if (ledgerEntries.length > 0) {
        const { error: insertError } = await supabase
          .from("fda_ledger")
          .insert(ledgerEntries);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "FDA rebuilt from PDA data",
      });

      return true;
    } catch (error) {
      console.error("Error rebuilding FDA:", error);
      toast({
        title: "Error",
        description: "Failed to rebuild FDA",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateFDAStatus = async (fdaId: string, status: FDA["status"]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("fda")
        .update({ status })
        .eq("id", fdaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `FDA status updated to ${status}`,
      });

      return true;
    } catch (error) {
      console.error("Error updating FDA status:", error);
      toast({
        title: "Error",
        description: "Failed to update FDA status",
        variant: "destructive",
      });
      return false;
    }
  };

  const calculateFDATotals = (ledger: FDALedger[]): FDATotals => {
    const totals = ledger.reduce(
      (acc, entry) => {
        const usd = entry.amount_usd || 0;
        const brl = entry.amount_local || 0;

        if (entry.side === "AP") {
          acc.totalAP_USD += usd;
          acc.totalAP_BRL += brl;
        } else if (entry.side === "AR") {
          acc.totalAR_USD += usd;
          acc.totalAR_BRL += brl;
        }

        return acc;
      },
      {
        totalAP_USD: 0,
        totalAP_BRL: 0,
        totalAR_USD: 0,
        totalAR_BRL: 0,
        net_USD: 0,
        net_BRL: 0,
      }
    );

    totals.net_USD = totals.totalAR_USD - totals.totalAP_USD;
    totals.net_BRL = totals.totalAR_BRL - totals.totalAP_BRL;

    return totals;
  };

  return {
    convertPdaToFda,
    getFDA,
    rebuildFromPda,
    updateFDAStatus,
    calculateFDATotals,
    loading,
  };
};