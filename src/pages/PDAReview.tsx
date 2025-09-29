import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Send, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePDA } from "@/hooks/usePDA";
import { useFDA } from "@/hooks/useFDA";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generatePDAHTML } from "@/components/pdf/PDADocument";

interface PDADetail {
  id: string;
  pda_number: string;
  tenant_id: string;
  to_display_name: string | null;
  sent_at: string | null;
  sent_by_user_id: string | null;
  status: "CREATED" | "IN_PROGRESS" | "SENT" | "APPROVED";
  vessel_name: string | null;
  imo_number: string | null;
  dwt: string | null;
  loa: string | null;
  beam: string | null;
  draft: string | null;
  port_name: string | null;
  berth: string | null;
  days_alongside: string | null;
  cargo: string | null;
  quantity: string | null;
  from_location: string | null;
  to_location: string | null;
  to_client_id: string | null;
  date_field: string | null;
  exchange_rate: string | null;
  exchange_rate_source: string | null;
  exchange_rate_source_url: string | null;
  exchange_rate_timestamp: string | null;
  pilotage_in: number;
  towage_in: number;
  light_dues: number;
  dockage: number;
  linesman: number;
  launch_boat: number;
  immigration: number;
  free_pratique: number;
  shipping_association: number;
  clearance: number;
  paperless_port: number;
  agency_fee: number;
  waterway: number;
  remarks: string | null;
  comments: any;
  created_at: string;
  updated_at: string;
}

const statusLabels = {
  CREATED: "Criada",
  IN_PROGRESS: "Em andamento",
  SENT: "Enviada",
  APPROVED: "Aprovada",
};

export default function PDAReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { convertPdaToFda, loading: fdaLoading } = useFDA();
  const [pda, setPda] = useState<PDADetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmApproval, setConfirmApproval] = useState(false);

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
      setPda(data);
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

  const handleMarkAsApproved = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from("pdas")
        .update({ 
          status: "APPROVED",
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      setPda(prev => prev ? { ...prev, status: "APPROVED" } : null);
      toast({
        title: "Sucesso",
        description: "PDA marcada como aprovada",
      });
    } catch (error) {
      console.error("Error updating PDA:", error);
      toast({
        title: "Erro",
        description: "Erro ao marcar PDA como aprovada",
        variant: "destructive",
      });
    }
    setConfirmApproval(false);
  };

  const handleSendToBilling = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from("pdas")
        .update({ 
          status: "SENT",
          sent_at: new Date().toISOString(),
          sent_by_user_id: "mock-user-id", // Will be replaced with actual user ID
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      setPda(prev => prev ? { 
        ...prev, 
        status: "SENT",
        sent_at: new Date().toISOString(),
        sent_by_user_id: "mock-user-id"
      } : null);

      toast({
        title: "Sucesso",
        description: "PDA enviada para cobrança",
      });
    } catch (error) {
      console.error("Error sending PDA:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar PDA",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = () => {
    if (!pda) return;

    try {
      const formattedShipData = {
        vesselName: pda.vessel_name || '',
        imoNumber: pda.imo_number,
        dwt: pda.dwt || '',
        loa: pda.loa || '',
        port: pda.port_name || '',
        terminal: pda.berth,
        cargoType: pda.cargo,
        arrivalDate: pda.date_field || new Date().toISOString().split('T')[0],
        departureDate: undefined,
        agent: undefined,
        exchangeRate: pda.exchange_rate || '5.25',
        exchangeRateSource: undefined,
        exchangeRateTimestamp: undefined
      };

      const formattedCostData = {
        pilotageIn: pda.pilotage_in || 0,
        towageIn: pda.towage_in || 0,
        lightDues: pda.light_dues || 0,
        dockage: pda.dockage || 0,
        linesman: pda.linesman || 0,
        launchBoat: pda.launch_boat || 0,
        immigration: pda.immigration || 0,
        freePratique: pda.free_pratique || 0,
        shippingAssociation: pda.shipping_association || 0,
        clearance: pda.clearance || 0,
        paperlessPort: pda.paperless_port || 0,
        agencyFee: pda.agency_fee || 0,
        waterway: pda.waterway || 0,
      };
      
      const htmlContent = generatePDAHTML({ 
        shipData: formattedShipData, 
        costData: formattedCostData,
        remarks: pda.remarks,
        comments: pda.comments ? JSON.parse(pda.comments) : undefined
      });
      
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        toast({
          title: "PDA Aberto",
          description: "Seu documento PDA foi aberto em uma nova aba. Use Ctrl+P ou o botão de impressão para salvar como PDF.",
        });
      } else {
        throw new Error('Falha ao abrir nova janela. Verifique as configurações do bloqueador de pop-up.');
      }
    } catch (error) {
      console.error('[PDA] Preview failed:', error);
      toast({
        title: "Falha na Visualização",
        description: error instanceof Error ? error.message : "Erro desconhecido ocorreu",
        variant: "destructive",
      });
    }
  };

  const handleConvertToFda = async () => {
    if (!id) return;
    
    try {
      const fdaId = await convertPdaToFda(id);
      if (fdaId) {
        navigate(`/fda/${fdaId}`);
      }
    } catch (error) {
      console.error("Error converting to FDA:", error);
      toast({
        title: "Error",
        description: "Failed to convert PDA to FDA. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pt-BR");
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

  if (!pda) {
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

  const totalUSD = Object.values({
    pilotageIn: pda.pilotage_in || 0,
    towageIn: pda.towage_in || 0,
    lightDues: pda.light_dues || 0,
    dockage: pda.dockage || 0,
    linesman: pda.linesman || 0,
    launchBoat: pda.launch_boat || 0,
    immigration: pda.immigration || 0,
    freePratique: pda.free_pratique || 0,
    shippingAssociation: pda.shipping_association || 0,
    clearance: pda.clearance || 0,
    paperlessPort: pda.paperless_port || 0,
    agencyFee: pda.agency_fee || 0,
    waterway: pda.waterway || 0,
  }).reduce((sum, cost) => sum + cost, 0);

  const totalBRL = totalUSD * parseFloat(pda.exchange_rate || "5.25");

  const costItems = [
    { label: "1. Pilot IN/OUT", value: pda.pilotage_in },
    { label: "2. Towage IN/OUT", value: pda.towage_in },
    { label: "3. Light dues", value: pda.light_dues },
    { label: "4. Dockage (Wharfage)", value: pda.dockage },
    { label: "5. Linesman (mooring/unmooring)", value: pda.linesman },
    { label: "6. Launch boat (mooring/unmooring)", value: pda.launch_boat },
    { label: "7. Immigration tax (Funapol)", value: pda.immigration },
    { label: "8. Free pratique tax", value: pda.free_pratique },
    { label: "9. Shipping association", value: pda.shipping_association },
    { label: "10. Clearance", value: pda.clearance },
    { label: "11. Paperless Port System", value: pda.paperless_port },
    { label: "12. Agency fee", value: pda.agency_fee },
    { label: "13. Waterway channel (Table I)", value: pda.waterway },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/pda")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pda.pda_number}</h1>
            <p className="text-muted-foreground">{pda.vessel_name}</p>
          </div>
        </div>
        <Badge 
          variant="outline"
          className={
            pda.status === "IN_PROGRESS" 
              ? "bg-muted text-muted-foreground" 
              : pda.status === "SENT"
              ? "bg-primary text-primary-foreground"
              : "bg-success text-success-foreground"
          }
        >
          {statusLabels[pda.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da PDA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">VESSEL DETAILS</h4>
              <div className="space-y-1 text-sm">
                <div>Name: {pda.vessel_name}</div>
                <div>IMO: {pda.imo_number || "—"}</div>
                <div>DWT: {pda.dwt}t</div>
                <div>LOA: {pda.loa}m</div>
                <div>Cargo: {pda.cargo}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">PORT INFORMATION</h4>
              <div className="space-y-1 text-sm">
                <div>Port: {pda.port_name}</div>
                <div>Terminal: {pda.berth}</div>
                <div>Client: {pda.to_display_name || "—"}</div>
                <div>Date: {pda.date_field}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">FINANCIAL</h4>
              <div className="space-y-1">
                <div className="text-lg font-bold text-primary">
                  ${totalUSD.toFixed(2)}
                </div>
                <div className="text-lg font-bold text-accent">
                  R$ {totalBRL.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Rate: {pda.exchange_rate}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead className="text-right">BRL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell className="text-right">
                    ${(item.value || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {((item.value || 0) * parseFloat(pda.exchange_rate || "5.25")).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 border-primary font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right text-primary">
                  ${totalUSD.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-accent">
                  R$ {totalBRL.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleGeneratePDF} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="mr-2 h-4 w-4" />
              Generate PDF
            </Button>
            {pda.status === "IN_PROGRESS" && (
              <Button onClick={handleSendToBilling}>
                <Send className="mr-2 h-4 w-4" />
                Send to Billing
              </Button>
            )}
            {pda.status !== "APPROVED" && (
              <Button 
                variant="outline" 
                onClick={() => setConfirmApproval(true)}
                className="border-success text-success hover:bg-success/10"
              >
                <Check className="mr-2 h-4 w-4" />
                Mark as Approved
              </Button>
            )}
            {pda.status === "APPROVED" && (
              <Button 
                onClick={handleConvertToFda}
                disabled={fdaLoading}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {fdaLoading ? "Converting..." : "Convert to FDA"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmApproval} onOpenChange={setConfirmApproval}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar aprovação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar esta PDA como aprovada? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApproval(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarkAsApproved}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}