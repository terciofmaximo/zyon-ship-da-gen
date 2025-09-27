'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Ship, MapPin, Calendar } from "lucide-react";
import type { ShipData } from "@/types";

const shipDataSchema = z.object({
  vesselName: z.string().min(1, "Nome do navio é obrigatório").max(100, "Nome muito longo"),
  imoNumber: z.string().optional(),
  dwt: z.string().min(1, "DWT é obrigatório").regex(/^\d+$/, "DWT deve ser um número"),
  loa: z.string().min(1, "LOA é obrigatório").regex(/^\d+(\.\d+)?$/, "LOA deve ser um número"),
  port: z.string().min(1, "Porto é obrigatório"),
  terminal: z.string().optional(),
  cargoType: z.string().optional(),
  arrivalDate: z.string().min(1, "Data de chegada é obrigatória"),
  departureDate: z.string().optional(),
  agent: z.string().optional(),
  exchangeRate: z.string().min(1, "Taxa de câmbio é obrigatória").regex(/^\d+(\.\d+)?$/, "Taxa deve ser um número"),
});

interface ShipDataFormProps {
  onNext: (data: ShipData) => void;
  initialData: Partial<ShipData>;
}

export function ShipDataForm({ onNext, initialData }: ShipDataFormProps) {
  const form = useForm<ShipData>({
    resolver: zodResolver(shipDataSchema),
    defaultValues: {
      vesselName: initialData.vesselName || "",
      imoNumber: initialData.imoNumber || "",
      dwt: initialData.dwt || "",
      loa: initialData.loa || "",
      port: initialData.port || "",
      terminal: initialData.terminal || "",
      cargoType: initialData.cargoType || "",
      arrivalDate: initialData.arrivalDate || "",
      departureDate: initialData.departureDate || "",
      agent: initialData.agent || "",
      exchangeRate: initialData.exchangeRate || "5.25",
    },
  });

  const onSubmit = (data: ShipData) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ship className="h-5 w-5 text-primary" />
                Informações do Navio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="vesselName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Navio *</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: MSC MAYA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imoNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número IMO</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: 9876543" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="dwt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DWT (toneladas) *</FormLabel>
                      <FormControl>
                        <Input placeholder="25000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="loa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LOA (metros) *</FormLabel>
                      <FormControl>
                        <Input placeholder="180.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Porto e Carga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porto *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o porto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="santos">Porto de Santos</SelectItem>
                        <SelectItem value="paranagua">Porto de Paranaguá</SelectItem>
                        <SelectItem value="rio">Porto do Rio de Janeiro</SelectItem>
                        <SelectItem value="suape">Porto de Suape</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terminal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terminal</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Terminal 37" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cargoType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Carga</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de carga" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="container">Container</SelectItem>
                        <SelectItem value="bulk">Carga a Granel</SelectItem>
                        <SelectItem value="grain">Grãos</SelectItem>
                        <SelectItem value="general">Carga Geral</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Cronograma e Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="arrivalDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Chegada *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previsão de Saída</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exchangeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Câmbio (USD/BRL) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="px-8">
            Próximo: Entrada de Custos
          </Button>
        </div>
      </form>
    </Form>
  );
}