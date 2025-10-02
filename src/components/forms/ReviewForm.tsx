import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Save, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePDA } from "@/hooks/usePDA";
import type { CostData } from "@/types";
import type { PDAStep1Data } from "@/schemas/pdaSchema";
import { generatePDAHTML } from "@/components/pdf/PDADocument";

interface ReviewFormProps {
  onBack: () => void;
  shipData: Partial<PDAStep1Data> & {
    remarks?: string;
    comments?: Record<string, string>;
  };
  costData: Partial<CostData>;
  pdaId?: string | null;
  sessionId?: string;
}

export function ReviewForm({ onBack, shipData, costData, pdaId, sessionId }: ReviewFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { savePDA, loading } = usePDA(sessionId);
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const totalUSD = Object.entries(costData)
    .filter(([key]) => key !== 'customLines')
    .reduce((sum: number, [, cost]) => sum + (typeof cost === 'number' ? cost : 0), 0) + 
    (costData.customLines || []).reduce((sum: number, line) => sum + line.costUSD, 0);
  const totalBRL = totalUSD * parseFloat(shipData.exchangeRate || "5.25");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showDownloadMessage, setShowDownloadMessage] = useState(false);

  const openPDAPreview = () => {
    console.info('[PDA] Opening PDF preview');
    
    try {
      // Convert data to match expected format
      const formattedShipData = {
        vesselName: shipData.vesselName || '',
        imoNumber: shipData.imoNumber,
        dwt: shipData.dwt || '',
        loa: shipData.loa || '',
        port: shipData.portName || '',
        terminal: shipData.berth,
        cargoType: shipData.cargo,
        arrivalDate: shipData.date || new Date().toISOString().split('T')[0],
        departureDate: undefined,
        agent: undefined,
        exchangeRate: shipData.exchangeRate || '5.25',
        exchangeRateSource: undefined,
        exchangeRateTimestamp: undefined
      };

      const formattedCostData = {
        pilotageIn: costData.pilotageIn || 0,
        towageIn: costData.towageIn || 0,
        lightDues: costData.lightDues || 0,
        dockage: costData.dockage || 0,
        linesman: costData.linesman || 0,
        launchBoat: costData.launchBoat || 0,
        immigration: costData.immigration || 0,
        freePratique: costData.freePratique || 0,
        shippingAssociation: costData.shippingAssociation || 0,
        clearance: costData.clearance || 0,
        paperlessPort: costData.paperlessPort || 0,
        agencyFee: costData.agencyFee || 0,
        waterway: costData.waterway || 0,
      };
      
      const htmlContent = generatePDAHTML({ 
        shipData: formattedShipData, 
        costData: formattedCostData,
        remarks: shipData.remarks,
        comments: shipData.comments
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

  const generateFilename = () => {
    const vesselName = shipData.vesselName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
    const portName = shipData.portName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
    const date = shipData.date?.replace(/\//g, '-') || new Date().toISOString().split('T')[0];
    return `PDA_${vesselName}_${portName}_${date}.pdf`;
  };

  const handleGeneratePDF = () => {
    openPDAPreview();
  };

  const handleSaveAndReturnToList = async () => {
    setIsSaving(true);
    try {
      const pdaData = {
        shipData: {
          ...shipData,
          remarks: shipData.remarks,
          comments: shipData.comments
        },
        costData
      };

      const result = await savePDA(pdaData, pdaId);
      
      toast({
        title: "Sucesso",
        description: "PDA salva com sucesso.",
      });

      // Navigate to PDA list with highlighting
      navigate(`/pda?highlighted=${result.id}`);
    } catch (error) {
      console.error("Error saving PDA:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar PDA. Tente novamente.",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndReturnToList}
          >
            Tentar novamente
          </Button>
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToFDA = async () => {
    setIsConverting(true);
    try {
      // If PDA doesn't exist yet, save it first
      let currentPdaId = pdaId;
      if (!currentPdaId) {
        const pdaData = {
          shipData: {
            ...shipData,
            remarks: shipData.remarks,
            comments: shipData.comments
          },
          costData
        };
        const result = await savePDA(pdaData);
        currentPdaId = result.id;
      }

      // Navigate to FDA creation with PDA reference
      navigate(`/fda/new?fromPdaId=${currentPdaId}`);
    } catch (error) {
      console.error("Error converting to FDA:", error);
      toast({
        title: "Erro",
        description: "Erro ao converter para FDA.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const costItems = [
    { label: "1. Pilot IN/OUT", value: costData.pilotageIn },
    { label: "2. Towage IN/OUT", value: costData.towageIn },
    { label: "3. Light dues", value: costData.lightDues },
    { label: "4. Dockage (Wharfage)", value: costData.dockage },
    { label: "5. Linesman (mooring/unmooring)", value: costData.linesman },
    { label: "6. Launch boat (mooring/unmooring)", value: costData.launchBoat },
    { label: "7. Immigration tax (Funapol)", value: costData.immigration },
    { label: "8. Free pratique tax", value: costData.freePratique },
    { label: "9. Shipping association", value: costData.shippingAssociation },
    { label: "10. Clearance", value: costData.clearance },
    { label: "11. Paperless Port System", value: costData.paperlessPort },
    { label: "12. Agency fee", value: costData.agencyFee },
    { label: "13. Waterway channel (Table I)", value: costData.waterway },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            PDA Review - {shipData.vesselName}
          </CardTitle>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <Badge variant="outline" className="text-xs">IMO: {shipData.imoNumber}</Badge>
            <Badge variant="outline" className="text-xs">DWT: {shipData.dwt}t</Badge>
            <Badge variant="outline" className="text-xs">LOA: {shipData.loa}m</Badge>
            <Badge variant="outline" className="text-xs">{shipData.portName}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground">VESSEL DETAILS</h4>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="truncate">Name: {shipData.vesselName}</div>
                <div>Cargo: {shipData.cargo}</div>
                <div>Terminal: {shipData.berth}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground">SCHEDULE</h4>
              <div className="space-y-1 text-xs sm:text-sm">
                <div>Date: {shipData.date}</div>
                <div>Days alongside: {shipData.daysAlongside}</div>
                <div>Rate: {shipData.exchangeRate}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground">TOTALS</h4>
              <div className="space-y-1">
                <div className="text-base sm:text-lg font-bold text-primary">
                  ${totalUSD.toFixed(2)}
                </div>
                <div className="text-base sm:text-lg font-bold text-accent">
                  R$ {totalBRL.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Description</TableHead>
                  <TableHead className="text-right min-w-[100px]">USD</TableHead>
                  <TableHead className="text-right min-w-[100px] hidden sm:table-cell">BRL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costItems.map((item, index) => (
                   <TableRow key={index}>
                     <TableCell className="font-medium text-xs sm:text-sm">{item.label}</TableCell>
                     <TableCell className="text-right text-xs sm:text-sm">
                       <div className="flex flex-col sm:block">
                         <span>${(item.value || 0).toFixed(2)}</span>
                         <span className="sm:hidden text-muted-foreground text-xs">
                           R$ {((item.value || 0) * parseFloat(shipData.exchangeRate || "5.25")).toFixed(2)}
                         </span>
                       </div>
                     </TableCell>
                     <TableCell className="text-right text-xs sm:text-sm hidden sm:table-cell">
                       R$ {((item.value || 0) * parseFloat(shipData.exchangeRate || "5.25")).toFixed(2)}
                     </TableCell>
                   </TableRow>
                ))}
                <TableRow className="border-t-2 border-primary font-bold">
                  <TableCell className="text-xs sm:text-sm">TOTAL</TableCell>
                  <TableCell className="text-right text-primary text-xs sm:text-sm">
                    <div className="flex flex-col sm:block">
                      <span>${totalUSD.toFixed(2)}</span>
                      <span className="sm:hidden text-accent text-xs">
                        R$ {totalBRL.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-accent text-xs sm:text-sm hidden sm:table-cell">
                    R$ {totalBRL.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-transparent shadow-soft rounded-xl">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Button 
              onClick={handleSaveAndReturnToList} 
              disabled={isSaving || loading}
              className="h-10 sm:h-12 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  Save & Return to List
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleConvertToFDA} 
              disabled={isConverting || isSaving}
              className="h-10 sm:h-12 text-xs sm:text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Convert to </span>FDA
                </>
              )}
            </Button>
            
            <div className="flex flex-col">
              <Button 
                onClick={handleGeneratePDF} 
                className="h-10 sm:h-12 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                Save as PDF
              </Button>
              {showDownloadMessage && (
                <p className="text-xs text-muted-foreground mt-2">
                  If the download didn't start automatically,{" "}
                  <button
                    onClick={() => {
                      if (pdfBlob) {
                        const url = window.URL.createObjectURL(pdfBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        const vesselName = shipData.vesselName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
                        const portName = shipData.portName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
                        const date = shipData.date?.replace(/\//g, '-') || new Date().toISOString().split('T')[0];
                        a.download = `PDA_${vesselName}_${portName}_${date}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      }
                    }}
                    className="text-primary hover:underline"
                  >
                    click here
                  </button>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack} 
          disabled={isSaving || loading}
          className="w-full sm:w-auto"
        >
          Back: Cost Entry
        </Button>
        <Button 
          onClick={handleSaveAndReturnToList} 
          disabled={isSaving || loading}
          className="px-4 sm:px-8 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save & Return to List
            </>
          )}
        </Button>
      </div>
    </div>
  );
}