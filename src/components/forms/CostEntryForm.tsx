import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, DollarSign, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ShipData, CostData } from "@/types";

interface CostEntryFormProps {
  onNext: (data: CostData) => void;
  onBack: () => void;
  shipData: Partial<ShipData>;
  initialData: Partial<CostData>;
}

// Mock calculation functions
const calculatePilotage = (dwt: number, loa: number) => {
  const baseFee = 1200;
  const dwtFactor = dwt * 0.08;
  const loaFactor = loa * 15;
  return Math.round(baseFee + dwtFactor + loaFactor);
};

const calculateTowage = (loa: number) => {
  return Math.round(loa * 45);
};

const calculateDockage = (loa: number, hours: number = 24) => {
  return Math.round(loa * 2.5 * hours);
};

const calculateWaterway = (dwt: number) => {
  return Math.round(dwt * 0.12);
};

export function CostEntryForm({ onNext, onBack, shipData, initialData }: CostEntryFormProps) {
  const [costs, setCosts] = useState({
    pilotageIn: 0,
    pilotageOut: 0,
    towageIn: 0,
    towageOut: 0,
    dockage: 0,
    waterway: 0,
    portDues: initialData.portDues || 0,
    security: initialData.security || 0,
    customs: initialData.customs || 0,
    immigration: initialData.immigration || 0,
    quarantine: initialData.quarantine || 0,
    agencyFee: initialData.agencyFee || 2500,
    clearance: initialData.clearance || 800,
  });

  useEffect(() => {
    if (shipData.dwt && shipData.loa) {
      const dwt = parseFloat(shipData.dwt);
      const loa = parseFloat(shipData.loa);
      
      setCosts(prev => ({
        ...prev,
        pilotageIn: calculatePilotage(dwt, loa),
        pilotageOut: calculatePilotage(dwt, loa),
        towageIn: calculateTowage(loa),
        towageOut: calculateTowage(loa),
        dockage: calculateDockage(loa),
        waterway: calculateWaterway(dwt),
      }));
    }
  }, [shipData]);

  const handleCostChange = (field: string, value: string) => {
    setCosts(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(costs);
  };

  const totalUSD = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  const totalBRL = totalUSD * parseFloat(shipData.exchangeRate || "5.25");

  const costItems = [
    { id: "pilotageIn", label: "1. Pilotage - Inbound", value: costs.pilotageIn, auto: true },
    { id: "pilotageOut", label: "2. Pilotage - Outbound", value: costs.pilotageOut, auto: true },
    { id: "towageIn", label: "3. Towage - Inbound", value: costs.towageIn, auto: true },
    { id: "towageOut", label: "4. Towage - Outbound", value: costs.towageOut, auto: true },
    { id: "dockage", label: "5. Dockage/Berth", value: costs.dockage, auto: true },
    { id: "portDues", label: "6. Port Dues", value: costs.portDues, auto: false },
    { id: "security", label: "7. Port Security", value: costs.security, auto: false },
    { id: "customs", label: "8. Customs", value: costs.customs, auto: false },
    { id: "immigration", label: "9. Immigration", value: costs.immigration, auto: false },
    { id: "quarantine", label: "10. Quarantine", value: costs.quarantine, auto: false },
    { id: "waterway", label: "11. Waterway Channel", value: costs.waterway, auto: true },
    { id: "agencyFee", label: "12. Agency Fee", value: costs.agencyFee, auto: false },
    { id: "clearance", label: "13. Clearance", value: costs.clearance, auto: false },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Cost Breakdown - {shipData.vesselName}
          </CardTitle>
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span>DWT: {shipData.dwt}t</span>
            <span>LOA: {shipData.loa}m</span>
            <span>Rate: {shipData.exchangeRate} BRL/USD</span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Description</TableHead>
                <TableHead className="min-w-[120px]">Amount (USD)</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                      <div className="sm:hidden flex gap-2 mt-1">
                        <Badge variant={item.auto ? "secondary" : "outline"} className="text-xs">
                          {item.auto ? "Auto" : "Manual"}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        value={item.value}
                        onChange={(e) => handleCostChange(item.id, e.target.value)}
                        className="w-20 sm:w-32 text-xs sm:text-sm"
                        disabled={item.auto}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={item.auto ? "secondary" : "outline"}>
                      {item.auto ? "Auto" : "Manual"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.auto && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" />
                        Calculated
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-gradient-secondary">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Total (USD)</Label>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">Total (BRL)</Label>
              <div className="text-2xl sm:text-3xl font-bold text-accent">
                R$ {totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
        <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
          Back: Ship Data
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
          Next: Review & Export
        </Button>
      </div>
    </form>
  );
}