import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Send, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ShipData, CostData } from "@/types";

interface ReviewFormProps {
  onBack: () => void;
  shipData: Partial<ShipData>;
  costData: Partial<CostData>;
}

export function ReviewForm({ onBack, shipData, costData }: ReviewFormProps) {
  const totalUSD = Object.values(costData).reduce((sum: number, cost: number) => sum + (cost || 0), 0);
  const totalBRL = totalUSD * parseFloat(shipData.exchangeRate || "5.25");

  const handleGeneratePDF = () => {
    // Mock PDF generation
    console.log("Generating PDA PDF...");
  };

  const handleConvertToFDA = () => {
    // Mock FDA conversion
    console.log("Converting to FDA...");
  };

  const handleSendToBilling = () => {
    // Mock billing integration
    console.log("Sending to billing system...");
  };

  const costItems = [
    { label: "1. Pilotage - Inbound", value: costData.pilotageIn },
    { label: "2. Pilotage - Outbound", value: costData.pilotageOut },
    { label: "3. Towage - Inbound", value: costData.towageIn },
    { label: "4. Towage - Outbound", value: costData.towageOut },
    { label: "5. Dockage/Berth", value: costData.dockage },
    { label: "6. Port Dues", value: costData.portDues },
    { label: "7. Port Security", value: costData.security },
    { label: "8. Customs", value: costData.customs },
    { label: "9. Immigration", value: costData.immigration },
    { label: "10. Quarantine", value: costData.quarantine },
    { label: "11. Waterway Channel", value: costData.waterway },
    { label: "12. Agency Fee", value: costData.agencyFee },
    { label: "13. Clearance", value: costData.clearance },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            PDA Review - {shipData.vesselName}
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
              <h4 className="font-semibold text-sm text-muted-foreground">VESSEL DETAILS</h4>
              <div className="space-y-1 text-sm">
                <div>Name: {shipData.vesselName}</div>
                <div>Cargo: {shipData.cargoType}</div>
                <div>Terminal: {shipData.terminal}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">SCHEDULE</h4>
              <div className="space-y-1 text-sm">
                <div>Arrival: {shipData.arrivalDate}</div>
                <div>Departure: {shipData.departureDate}</div>
                <div>Exchange Rate: {shipData.exchangeRate}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">TOTALS</h4>
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
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount (USD)</TableHead>
                <TableHead className="text-right">Amount (BRL)</TableHead>
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
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleGeneratePDF} className="h-12">
              <Download className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
            <Button onClick={handleConvertToFDA} variant="outline" className="h-12">
              <RefreshCw className="h-4 w-4 mr-2" />
              Convert to FDA
            </Button>
            <Button onClick={handleSendToBilling} variant="secondary" className="h-12">
              <Send className="h-4 w-4 mr-2" />
              Send to Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back: Cost Entry
        </Button>
        <Button onClick={handleGeneratePDF} className="px-8">
          Complete PDA
        </Button>
      </div>
    </div>
  );
}