import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthProvider";
import { useOrg } from "@/context/OrgProvider";
import { getActiveTenantId } from "@/lib/utils";

type PDADetail = {
  id: string;
  tracking_id: string;
  vessel_name: string;
  port_name: string;
  status: string;
  created_at: string;
  imo_number: string | null;
  terminal: string | null;
  berth: string | null;
  [key: string]: any;
};

export default function PublicPDAView() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { activeOrg } = useOrg();
  const [pda, setPda] = useState<PDADetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    loadPDA();
    
    // Check if we should trigger conversion after login
    if (searchParams.get("action") === "toFDA" && user && pda) {
      handleConvertToFDA();
    }
  }, [trackingId, searchParams, user]);

  const loadPDA = async () => {
    if (!trackingId) {
      setError("No tracking ID provided");
      setLoading(false);
      return;
    }

    if (!activeOrg) {
      setError("No active organization");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch PDA with org validation
      const tenantId = getActiveTenantId(activeOrg);
      if (!tenantId) {
        throw new Error("Active organization required");
      }
      
      const { data, error } = await supabase
        .from("pdas")
        .select("*")
        .eq("tracking_id", trackingId.toUpperCase())
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setError("PDA not found or you don't have access");
      } else {
        setPda(data);
      }
    } catch (error: any) {
      setError("Failed to load PDA");
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToFDA = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to convert PDA to FDA",
        variant: "destructive",
      });
      return;
    }

    if (!activeOrg) {
      toast({
        title: "Organization Required",
        description: "Please select an organization to convert PDA to FDA",
        variant: "destructive",
      });
      return;
    }

    if (!pda) return;

    setConverting(true);
    try {
      const { data: fdaId, error } = await supabase.rpc("convert_pda_to_fda", {
        p_pda_id: pda.id,
      });

      if (error) throw error;

      toast({
        title: "FDA Criado",
        description: "PDA convertido para FDA com sucesso!",
      });

      navigate(`/fda/${fdaId}`);
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast({
        title: "Erro na conversão",
        description: error.message || "Falha ao converter PDA para FDA",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !pda) {
    return (
      <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-muted-foreground">{error || "PDA not found"}</p>
              <Button onClick={() => navigate("/pda")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to PDAs
              </Button>
            </CardContent>
          </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">PDA {pda.tracking_id}</h1>
            <Badge variant="outline" className="mt-2">
              {pda.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConvertToFDA} disabled={converting}>
              <ArrowRight className="h-4 w-4 mr-2" />
              {converting ? "Convertendo..." : "Converter para FDA"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/pda")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Port Disbursement Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Vessel Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Vessel Name</dt>
                    <dd className="font-medium">{pda.vessel_name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">IMO Number</dt>
                    <dd className="font-mono">{pda.imo_number || "-"}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Port Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Port</dt>
                    <dd className="font-medium">{pda.port_name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Terminal</dt>
                    <dd>{pda.terminal || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Berth</dt>
                    <dd>{pda.berth || "-"}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Details</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd>{new Date(pda.created_at).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

    </div>
  );
}
