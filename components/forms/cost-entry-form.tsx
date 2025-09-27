'use client'

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calculator, DollarSign, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ShipData, CostData } from "@/types";

const costDataSchema = z.object({
  pilotageIn: z.number().min(0, "Valor deve ser positivo"),
  pilotageOut: z.number().min(0, "Valor deve ser positivo"),
  towageIn: z.number().min(0, "Valor deve ser positivo"),
  towageOut: z.number().min(0, "Valor deve ser positivo"),
  dockage: z.number().min(0, "Valor deve ser positivo"),
  waterway: z.number().min(0, "Valor deve ser positivo"),
  portDues: z.number().min(0, "Valor deve ser positivo"),
  security: z.number().min(0, "Valor deve ser positivo"),
  customs: z.number().min(0, "Valor deve ser positivo"),
  immigration: z.number().min(0, "Valor deve ser positivo"),
  quarantine: z.number().min(0, "Valor deve ser positivo"),
  agencyFee: z.number().min(0, "Valor deve ser positivo"),
  clearance: z.number().min(0, "Valor deve ser positivo"),
});

interface CostEntryFormProps {
  onNext: (data: CostData) => void;
  onBack: () => void;
  shipData: Partial<ShipData>;
  initialData: Partial<CostData>;
}

// Funções de cálculo
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
  const form = useForm<CostData>({
    resolver: zodResolver(costDataSchema),
    defaultValues: {
      pilotageIn: initialData.pilotageIn || 0,
      pilotageOut: initialData.pilotageOut || 0,
      towageIn: initialData.towageIn || 0,
      towageOut: initialData.towageOut || 0,
      dockage: initialData.dockage || 0,
      waterway: initialData.waterway || 0,
      portDues: initialData.portDues || 0,
      security: initialData.security || 0,
      customs: initialData.customs || 0,
      immigration: initialData.immigration || 0,
      quarantine: initialData.quarantine || 0,
      agencyFee: initialData.agencyFee || 2500,
      clearance: initialData.clearance || 800,
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (shipData.dwt && shipData.loa) {
      const dwt = parseFloat(shipData.dwt);
      const loa = parseFloat(shipData.loa);
      
      form.setValue('pilotageIn', calculatePilotage(dwt, loa));
      form.setValue('pilotageOut', calculatePilotage(dwt, loa));
      form.setValue('towageIn', calculateTowage(loa));
      form.setValue('towageOut', calculateTowage(loa));
      form.setValue('dockage', calculateDockage(loa));
      form.setValue('waterway', calculateWaterway(dwt));
    }
  }, [shipData, form]);

  const onSubmit = (data: CostData) => {
    onNext(data);
  };

  const totalUSD = Object.values(watchedValues).reduce((sum, cost) => sum + (cost || 0), 0);
  const totalBRL = totalUSD * parseFloat(shipData.exchangeRate || "5.25");

  const costItems = [
    { id: "pilotageIn", label: "1. Praticagem - Entrada", auto: true },
    { id: "pilotageOut", label: "2. Praticagem - Saída", auto: true },
    { id: "towageIn", label: "3. Reboque - Entrada", auto: true },
    { id: "towageOut", label: "4. Reboque - Saída", auto: true },
    { id: "dockage", label: "5. Atracação/Berço", auto: true },
    { id: "portDues", label: "6. Taxas Portuárias", auto: false },
    { id: "security", label: "7. Segurança Portuária", auto: false },
    { id: "customs", label: "8. Alfândega", auto: false },
    { id: "immigration", label: "9. Imigração", auto: false },
    { id: "quarantine", label: "10. Quarentena", auto: false },
    { id: "waterway", label: "11. Canal/Hidrovia", auto: true },
    { id: "agencyFee", label: "12. Taxa de Agência", auto: false },
    { id: "clearance", label: "13. Desembaraço", auto: false },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Breakdown de Custos - {shipData.vesselName}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>DWT: {shipData.dwt}t</span>
              <span>LOA: {shipData.loa}m</span>
              <span>Taxa de Câmbio: {shipData.exchangeRate} BRL/USD</span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor (USD)</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={item.id as keyof CostData}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="w-32"
                                  disabled={item.auto}
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.auto ? "secondary" : "outline"}>
                        {item.auto ? "Auto" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.auto && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Info className="h-3 w-3" />
                          Calculado
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormLabel className="text-base font-semibold">Total (USD)</FormLabel>
                <div className="text-3xl font-bold text-primary">
                  ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-2">
                <FormLabel className="text-base font-semibold">Total (BRL)</FormLabel>
                <div className="text-3xl font-bold text-accent">
                  R$ {totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Voltar: Dados do Navio
          </Button>
          <Button type="submit">
            Próximo: Revisão e Exportação
          </Button>
        </div>
      </form>
    </Form>
  );
}