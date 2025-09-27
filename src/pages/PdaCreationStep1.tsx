import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Ship, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { VESSEL_TYPES } from "@/lib/vesselData";
import { pdaStep1Schema, type PDAStep1Data } from "@/schemas/pdaSchema";

const clients = [
  "Vale S.A.",
  "Petrobras",
  "Cargill",
  "ADM",
  "Bunge",
  "Santos Brasil",
  "Terminal de Contêineres de Paranaguá",
];

export default function PdaCreationStep1() {
  const [selectedVessel, setSelectedVessel] = useState<string>("");

  const form = useForm<PDAStep1Data>({
    resolver: zodResolver(pdaStep1Schema),
    defaultValues: {
      vesselName: "",
      imoNumber: "",
      dwt: "",
      loa: "",
      beam: "",
      draft: "",
      portName: "",
      berth: "",
      daysAlongside: "",
      cargo: "",
      quantity: "",
      from: "Zyon Shipping",
      to: "",
      date: format(new Date(), "yyyy-MM-dd"),
      exchangeRate: "5.25",
    },
  });

  const { setValue, watch } = form;
  const vesselName = watch("vesselName");

  useEffect(() => {
    if (vesselName && vesselName !== selectedVessel) {
      const vessel = VESSEL_TYPES.find(v => v.classification === vesselName);
      if (vessel) {
        setValue("dwt", vessel.minDwt.toString());
        setValue("loa", vessel.loa.toString());
        setValue("beam", vessel.beam.toString());
        setValue("draft", vessel.draft.toString());
        setSelectedVessel(vesselName);
      }
    }
  }, [vesselName, selectedVessel, setValue]);

  const onSubmit = (data: PDAStep1Data) => {
    console.log("PDA Step 1 Data:", data);
    // Simular navegação para próximo passo
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Create New PDA - Step 1: Ship Data
          </h1>
          <p className="text-muted-foreground">
            Enter vessel information and port details
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vessel Information */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ship className="h-5 w-5 text-primary" />
                  Vessel Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="vesselName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vessel's Name *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="e.g. MV Panamax TBN" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VESSEL_TYPES.map((vessel) => (
                              <SelectItem key={vessel.classification} value={vessel.classification}>
                                {vessel.classification}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imoNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMO Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 9876543" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="dwt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DWT (tons) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="25000" {...field} />
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
                        <FormLabel>LOA (meters) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="180.50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="beam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beam (meters) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="32.3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="draft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Draft (meters) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="12.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Port & Cargo Details */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Port & Cargo Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="portName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port's Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Port of Santos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="berth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Berth(s)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Berth 37" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="daysAlongside"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days alongside</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cargo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Iron Ore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 180,000 MT" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Financial */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Schedule & Financial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From *</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client} value={client}>
                                {client}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
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
                        <FormLabel>Exchange Rate (USD/BRL) *</FormLabel>
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
                Next: Cost Entry
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}