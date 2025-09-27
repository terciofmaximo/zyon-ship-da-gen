import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Ship, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { ExchangeRateBadge } from "@/components/ui/exchange-rate-badge";
import { cn, formatRange } from "@/lib/utils";
import { VESSEL_TYPES } from "@/lib/vesselData";
import { pdaStep1Schema, type PDAStep1Data } from "@/schemas/pdaSchema";

const clients = [
  { value: "vale-sa", label: "Vale S.A." },
  { value: "petrobras", label: "Petrobras" },
  { value: "cargill", label: "Cargill" },
  { value: "adm", label: "ADM" },
  { value: "bunge", label: "Bunge" },
  { value: "santos-brasil", label: "Santos Brasil" },
  { value: "tcp", label: "Terminal de Contêineres de Paranaguá" },
];

const vesselSuggestions = [
  { value: "MV Handysize TBN", label: "MV Handysize TBN" },
  { value: "MV Handymax TBN", label: "MV Handymax TBN" },
  { value: "MV Panamax TBN", label: "MV Panamax TBN" },
  { value: "MV Capesize TBN", label: "MV Capesize TBN" },
  { value: "MV Valemax TBN", label: "MV Valemax TBN" },
  { value: "MT Coastal Tanker", label: "MT Coastal Tanker" },
  { value: "MT Aframax", label: "MT Aframax" },
  { value: "MT Suezmax", label: "MT Suezmax" },
  { value: "MT VLCC", label: "MT VLCC" },
  { value: "MT ULCC", label: "MT ULCC" },
];

interface PdaCreationStep1Props {
  onNext?: (data: PDAStep1Data) => void;
  initialData?: Partial<PDAStep1Data>;
}

export default function PdaCreationStep1({ onNext, initialData }: PdaCreationStep1Props = {}) {

  const [selectedVessel, setSelectedVessel] = useState<string>("");

  const form = useForm<PDAStep1Data>({
    resolver: zodResolver(pdaStep1Schema),
    defaultValues: {
      vesselName: initialData?.vesselName || "",
      imoNumber: initialData?.imoNumber || "",
      dwt: initialData?.dwt || "",
      loa: initialData?.loa || "",
      beam: initialData?.beam || "",
      draft: initialData?.draft || "",
      portName: initialData?.portName || "",
      berth: initialData?.berth || "",
      daysAlongside: initialData?.daysAlongside || "",
      cargo: initialData?.cargo || "",
      quantity: initialData?.quantity || "",
      from: initialData?.from || "Zyon Shipping",
      to: initialData?.to || "",
      toClientId: initialData?.toClientId || "",
      date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
      exchangeRate: initialData?.exchangeRate || "5.25",
      exchangeRateSource: initialData?.exchangeRateSource || "MANUAL",
      exchangeRateSourceUrl: initialData?.exchangeRateSourceUrl || "",
      exchangeRateTimestamp: initialData?.exchangeRateTimestamp || "",
    },
  });

  const { setValue, watch } = form;
  const vesselName = watch("vesselName");
  const exchangeRate = watch("exchangeRate");
  const exchangeRateSource = watch("exchangeRateSource");
  const exchangeRateSourceUrl = watch("exchangeRateSourceUrl");
  const exchangeRateTimestamp = watch("exchangeRateTimestamp");

  useEffect(() => {
    if (vesselName && vesselName !== selectedVessel) {
      const vessel = VESSEL_TYPES.find(v => v.classification === vesselName);
      if (vessel) {
        // Display formatted range in UI, store min value in form
        setValue("dwt", formatRange(vessel.minDwt, vessel.maxDwt, "tons"));
        setValue("loa", vessel.loa.toString());
        setValue("beam", vessel.beam.toString());
        setValue("draft", vessel.draft.toString());
        setSelectedVessel(vesselName);
      }
    }
  }, [vesselName, selectedVessel, setValue]);

  // Simulate fetching exchange rate from BCB PTAX
  const fetchExchangeRate = async () => {
    // Simulate API call
    const mockRate = "5.42";
    const timestamp = new Date().toISOString();
    
    setValue("exchangeRate", mockRate);
    setValue("exchangeRateSource", "BCB_PTAX_D1");
    setValue("exchangeRateTimestamp", timestamp);
  };

  const handleExchangeRateChange = (value: string) => {
    setValue("exchangeRate", value);
    setValue("exchangeRateSource", "MANUAL");
    setValue("exchangeRateSourceUrl", "");
    setValue("exchangeRateTimestamp", "");
  };

  const handleSourceUrlChange = (value: string) => {
    setValue("exchangeRateSourceUrl", value);
    if (value.trim()) {
      setValue("exchangeRateSource", "PROVIDER_X");
    }
  };

  const handleToChange = (value: string) => {
    setValue("to", value);
    
    // Check if value matches a client
    const client = clients.find(c => c.label === value);
    if (client) {
      setValue("toClientId", client.value);
    } else {
      setValue("toClientId", "");
    }
  };

  const onSubmit = (data: PDAStep1Data) => {
    console.log("PDA Step 1 Data:", data);
    if (onNext) {
      onNext(data);
    }
  };

  return (
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
          {/* Schedule & Financial - moved to top */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                Schedule & Financial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Type recipient name..."
                          onChange={(e) => handleToChange(e.target.value)}
                        />
                      </FormControl>
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
                      <FormLabel className="flex items-center gap-2">
                        Exchange Rate (USD/BRL) *
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={fetchExchangeRate}
                        >
                          Fetch Latest
                        </Button>
                      </FormLabel>
                      <div className="space-y-2">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            value={field.value}
                            onChange={(e) => handleExchangeRateChange(e.target.value)}
                          />
                        </FormControl>
                        <ExchangeRateBadge
                          source={exchangeRateSource}
                          timestamp={exchangeRateTimestamp}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exchangeRateSourceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exchange Rate Source (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Paste link or source info here..."
                          onChange={(e) => handleSourceUrlChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

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
                        <FormLabel>Ship's Name *</FormLabel>
                        <FormControl>
                          <Combobox
                            options={vesselSuggestions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="e.g. MV Panamax TBN"
                            searchPlaceholder="Type vessel name..."
                            emptyMessage="No suggestions found. You can type any vessel name."
                            allowCustom={true}
                          />
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
                          <Input placeholder="e.g. 65,000 - 80,000 tons" {...field} />
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

          <div className="flex justify-end">
            <Button type="submit" className="px-8">
              Next: Cost Entry
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}