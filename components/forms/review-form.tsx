'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Send, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { ShipData, CostData } from "@/types";

interface ReviewFormProps {
  onBack: () => void;
  shipData: Partial<ShipData>;
  costData: Partial<CostData>;
}

export function ReviewForm({ onBack, shipData, costData }: ReviewFormProps) {
  const { toast } = useToast();
  
  const totalUSD = Object.values(costData).reduce((sum, cost) => {
    return sum + (typeof cost === 'number' ? cost : 0);
  }, 0);
  
  const totalBRL = totalUSD * parseFloat(shipData.exchangeRate || "5.25");

  const handleGeneratePDF = () => {
    toast({
      title: "PDF Gerado com Sucesso",
      description: "O documento PDA foi exportado para PDF.",
    });
  };

  const handleConvertToFDA = () => {
    toast({
      title: "Conversão para FDA",
      description: "Documento convertido para Final Disbursement Account.",
    });
  };

  const handleSendToBilling = () => {
    toast({
      title: "Enviado para Faturamento",
      description: "Documento enviado para o sistema de billing.",
    });
  };

  const costItems = [
    { label: "1. Praticagem - Entrada", value: costData.pilotageIn },
    { label: "2. Praticagem - Saída", value: costData.pilotageOut },
    { label: "3. Reboque - Entrada", value: costData.towageIn },
    { label: "4. Reboque - Saída", value: costData.towageOut },
    { label: "5. Atracação/Berço", value: costData.dockage },
    { label: "6. Taxas Portuárias", value: costData.portDues },
    { label: "7. Segurança Portuária", value: costData.security },
    { label: "8. Alfândega", value: costData.customs },
    { label: "9. Imigração", value: costData.immigration },
    { label: "10. Quarentena", value: costData.quarantine },
    { label: "11. Canal/Hidrovia", value: costData.waterway },
    { label: "12. Taxa de Agência", value: costData.agencyFee },
    { label: "13. Desembaraço", value: costData.clearance },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Revisão PDA - {shipData.vesselName}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">IMO: {shipData.imoNumber}</Badge>
            <Badge variant="outline">DWT: {shipData.dwt}t</Badge>
            <Badge variant="outline">LOA: {shipData.loa}m</Badge>
            <Badge variant="outline">{shipData.port}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">DETALHES DO NAVIO</h4>
              <div className="space-y-1 text-sm">
                <div>Nome: {shipData.vesselName}</div>
                <div>Carga: {shipData.cargoType}</div>
                <div>Terminal: {shipData.terminal}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">CRONOGRAMA</h4>
              <div className="space-y-1 text-sm">
                <div>Chegada: {shipData.arrivalDate}</div>
                <div>Saída: {shipData.departureDate}</div>
                <div>Taxa de Câmbio: {shipData.exchangeRate}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">TOTAIS</h4>
              <div className="space-y-1">
                <div className="text-lg font-bold text-primary">
                  ${totalUSD.toFixed(2)}
                </div>
                <div className="text-lg font-bold text-accent">
                  R$ {totalBRL.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor (USD)</TableHead>
                <TableHead className="text-right">Valor (BRL)</TableHead>
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
                     R$ {((item.value || 0) * parseFloat(shipData.exchangeRate || "5.25")).toFixed(2)}
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

      <Card className="bg-gradient-secondary">
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleGeneratePDF} className="h-12">
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
            <Button onClick={handleConvertToFDA} variant="outline" className="h-12">
              <RefreshCw className="h-4 w-4 mr-2" />
              Converter para FDA
            </Button>
            <Button onClick={handleSendToBilling} variant="secondary" className="h-12">
              <Send className="h-4 w-4 mr-2" />
              Enviar para Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar: Entrada de Custos
        </Button>
        <Button onClick={handleGeneratePDF} className="px-8">
          Finalizar PDA
        </Button>
      </div>
    </div>
  );
}