import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { NewPDAWizard } from "@/components/forms/NewPDAWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PDAStep1Data } from "@/schemas/pdaSchema";
import type { CostData } from "@/types";

export default function PDAEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [initialShipData, setInitialShipData] = useState<Partial<PDAStep1Data> & {
    remarks?: string;
    comments?: Record<string, string>;
  }>();
  const [initialCostData, setInitialCostData] = useState<Partial<CostData>>();

  useEffect(() => {
    if (id) {
      fetchPDA();
    }
  }, [id]);

  const fetchPDA = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pdas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Map PDA data to wizard format
      setInitialShipData({
        vesselName: data.vessel_name || '',
        imoNumber: data.imo_number || undefined,
        dwt: data.dwt || '',
        loa: data.loa || '',
        beam: data.beam || undefined,
        draft: data.draft || undefined,
        portName: data.port_name || '',
        terminal: data.terminal || undefined,
        berth: data.berth || undefined,
        cargo: data.cargo || undefined,
        date: data.date_field || undefined,
        exchangeRate: data.exchange_rate || '',
        remarks: data.remarks || undefined,
        comments: (data.comments && typeof data.comments === 'object' && !Array.isArray(data.comments)) 
          ? data.comments as Record<string, string>
          : undefined,
      });

      setInitialCostData({
        pilotageIn: data.pilotage_in || 0,
        towageIn: data.towage_in || 0,
        lightDues: data.light_dues || 0,
        dockage: data.dockage || 0,
        linesman: data.linesman || 0,
        launchBoat: data.launch_boat || 0,
        immigration: data.immigration || 0,
        freePratique: data.free_pratique || 0,
        shippingAssociation: data.shipping_association || 0,
        clearance: data.clearance || 0,
        paperlessPort: data.paperless_port || 0,
        agencyFee: data.agency_fee || 0,
        waterway: data.waterway || 0,
      });
    } catch (error) {
      console.error("Error fetching PDA:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar PDA",
        variant: "destructive",
      });
      navigate("/pda");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando PDA...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!initialShipData || !initialCostData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">PDA não encontrada</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <NewPDAWizard 
        editMode={true}
        pdaId={id}
        initialShipData={initialShipData}
        initialCostData={initialCostData}
      />
    </div>
  );
}
