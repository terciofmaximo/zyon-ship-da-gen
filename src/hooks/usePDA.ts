import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PDAStep1Data } from "@/schemas/pdaSchema";
import type { CostData } from "@/types";

interface PDAData {
  shipData: Partial<PDAStep1Data> & {
    remarks?: string;
    comments?: Record<string, string>;
  };
  costData: Partial<CostData>;
}

export function usePDA() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const savePDA = async (data: PDAData, pdaId?: string) => {
    setLoading(true);
    try {
      // For now using hardcoded user ID as tenant - will be replaced with proper auth
      const mockTenantId = "123e4567-e89b-12d3-a456-426614174000";
      
      const pdaData = {
        tenant_id: mockTenantId,
        vessel_name: data.shipData.vesselName || "",
        imo_number: data.shipData.imoNumber,
        dwt: data.shipData.dwt,
        loa: data.shipData.loa,
        beam: data.shipData.beam,
        draft: data.shipData.draft,
        port_name: data.shipData.portName,
        terminal: data.shipData.terminal,
        berth: data.shipData.berth,
        days_alongside: data.shipData.daysAlongside,
        cargo: data.shipData.cargo,
        quantity: data.shipData.quantity,
        from_location: data.shipData.from,
        to_location: data.shipData.to,
        to_client_id: data.shipData.toClientId,
        to_display_name: data.shipData.to || "",
        date_field: data.shipData.date,
        exchange_rate: data.shipData.exchangeRate,
        exchange_rate_source: data.shipData.exchangeRateSource,
        exchange_rate_source_url: data.shipData.exchangeRateSourceUrl,
        exchange_rate_timestamp: data.shipData.exchangeRateTimestamp,
        
        // Cost data
        pilotage_in: data.costData.pilotageIn || 0,
        towage_in: data.costData.towageIn || 0,
        light_dues: data.costData.lightDues || 0,
        dockage: data.costData.dockage || 0,
        linesman: data.costData.linesman || 0,
        launch_boat: data.costData.launchBoat || 0,
        immigration: data.costData.immigration || 0,
        free_pratique: data.costData.freePratique || 0,
        shipping_association: data.costData.shippingAssociation || 0,
        clearance: data.costData.clearance || 0,
        paperless_port: data.costData.paperlessPort || 0,
        agency_fee: data.costData.agencyFee || 0,
        waterway: data.costData.waterway || 0,
        
        // Additional fields
        remarks: data.shipData.remarks,
        comments: data.shipData.comments ? JSON.stringify(data.shipData.comments) : null,
      };

      let result;
      
      if (pdaId) {
        // Update existing PDA
        result = await supabase
          .from("pdas")
          .update(pdaData)
          .eq("id", pdaId)
          .select()
          .single();
      } else {
        // Create new PDA with generated PDA number
        const { data: pdaNumber } = await supabase
          .rpc("generate_pda_number", { p_tenant_id: mockTenantId });
        
        result = await supabase
          .from("pdas")
          .insert({
            ...pdaData,
            pda_number: pdaNumber,
            status: "IN_PROGRESS"
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "Sucesso",
        description: pdaId ? "PDA atualizada com sucesso" : "PDA criada com sucesso",
      });

      return result.data;
    } catch (error) {
      console.error("Error saving PDA:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar PDA",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPDA = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("pdas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching PDA:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar PDA",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    savePDA,
    getPDA,
    loading,
  };
}