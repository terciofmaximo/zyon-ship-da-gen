import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Ship, MapPin, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { ExchangeRateBadge } from "@/components/ui/exchange-rate-badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn, formatRange } from "@/lib/utils";
import { VESSEL_TYPES } from "@/lib/vesselData";
import { SHIP_TYPE_RANGES, getShipTypeFromName, calculateMeanValue, isValueInRange, formatRange as formatShipRange } from "@/lib/shipTypeRanges";
import { usePortDirectory } from "@/hooks/usePortDirectory";
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
  { value: "MV Supramax TBN", label: "MV Supramax TBN" },
  { value: "MV Panamax TBN", label: "MV Panamax TBN" },
  { value: "MV Capesize TBN", label: "MV Capesize TBN" },
  { value: "MV Valemax TBN", label: "MV Valemax TBN" },
  { value: "MT Coastal Tanker TBN", label: "MT Coastal Tanker TBN" },
  { value: "MT Aframax TBN", label: "MT Aframax TBN" },
  { value: "MT Suezmax TBN", label: "MT Suezmax TBN" },
  { value: "MT VLCC TBN", label: "MT VLCC TBN" },
  { value: "MT ULCC TBN", label: "MT ULCC TBN" },
];

interface PdaCreationStep1Props {
  onNext?: (data: PDAStep1Data) => void;
  initialData?: Partial<PDAStep1Data>;
}

export default function PdaCreationStep1({ onNext, initialData }: PdaCreationStep1Props = {}) {

  const [selectedVessel, setSelectedVessel] = useState<string>("");
  const [currentShipType, setCurrentShipType] = useState<string | null>(null);
  const [autoFilledValues, setAutoFilledValues] = useState<Record<string, boolean>>({});
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [pendingShipType, setPendingShipType] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string>>({});

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
      terminal: initialData?.terminal || "",
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

  const portState = usePortDirectory();

  const fillShipParticulars = (shipType: string, skipDialog = false) => {
    const ranges = SHIP_TYPE_RANGES[shipType];
    if (!ranges) return;

    setValue("dwt", calculateMeanValue(ranges.dwt).toString());
    setValue("loa", calculateMeanValue(ranges.loa).toString());
    setValue("beam", calculateMeanValue(ranges.beam).toString());
    setValue("draft", calculateMeanValue(ranges.draft).toString());

    setAutoFilledValues({
      dwt: true,
      loa: true,
      beam: true,
      draft: true
    });
    
    setCurrentShipType(shipType);
    setSelectedVessel(vesselName);
  };

  const validateFieldValue = (fieldName: string, value: string) => {
    if (!currentShipType || !value) {
      setValidationWarnings(prev => ({ ...prev, [fieldName]: "" }));
      return;
    }

    const ranges = SHIP_TYPE_RANGES[currentShipType];
    if (!ranges) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const fieldRange = ranges[fieldName as keyof typeof ranges];
    if (!isValueInRange(numValue, fieldRange)) {
      setValidationWarnings(prev => ({ 
        ...prev, 
        [fieldName]: `Valor fora do range típico para ${currentShipType} (${fieldRange[0]}–${fieldRange[1]}).`
      }));
    } else {
      setValidationWarnings(prev => ({ ...prev, [fieldName]: "" }));
    }
  };

  useEffect(() => {
    if (vesselName && vesselName !== selectedVessel) {
      const shipType = getShipTypeFromName(vesselName);
      
      // Check legacy vessel data first
      const vessel = VESSEL_TYPES.find(v => v.classification === vesselName);
      
      if (shipType && SHIP_TYPE_RANGES[shipType]) {
        // Check if user has manual edits
        const hasManualEdits = Object.values(autoFilledValues).some(val => !val) && currentShipType;
        
        if (hasManualEdits && currentShipType !== shipType) {
          setPendingShipType(shipType);
          setShowUpdateDialog(true);
        } else {
          fillShipParticulars(shipType, true);
        }
      } else if (vessel) {
        // Fallback to legacy system
        setValue("dwt", formatRange(vessel.minDwt, vessel.maxDwt, "tons"));
        setValue("loa", vessel.loa.toString());
        setValue("beam", vessel.beam.toString());
        setValue("draft", vessel.draft.toString());
        setSelectedVessel(vesselName);
        setCurrentShipType(null);
        setAutoFilledValues({});
      }
    }
  }, [vesselName, selectedVessel, setValue, autoFilledValues, currentShipType]);

  // Initialize port directory with existing values
  useEffect(() => {
    const currentPort = form.getValues("portName");
    const currentTerminal = form.getValues("terminal");
    const currentBerth = form.getValues("berth");
    
    if (currentPort || currentTerminal || currentBerth) {
      portState.initialize(currentPort, currentTerminal, currentBerth);
    }
  }, [portState]);

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

  const handleUpdateToNewType = () => {
    if (pendingShipType) {
      fillShipParticulars(pendingShipType, true);
      setPendingShipType(null);
    }
    setShowUpdateDialog(false);
  };

  const handleKeepCurrentValues = () => {
    setSelectedVessel(vesselName);
    setPendingShipType(null);
    setShowUpdateDialog(false);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setAutoFilledValues(prev => ({ ...prev, [fieldName]: false }));
    validateFieldValue(fieldName, value);
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
                        <FormLabel className="flex items-center gap-2">
                          DWT (MT) *
                          {autoFilledValues.dwt && (
                            <Badge variant="secondary" className="text-xs">auto</Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="1"
                            placeholder="e.g. 75000"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleFieldChange("dwt", e.target.value);
                            }}
                          />
                        </FormControl>
                        {currentShipType && SHIP_TYPE_RANGES[currentShipType] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatShipRange(SHIP_TYPE_RANGES[currentShipType].dwt, "MT")}
                          </p>
                        )}
                        {validationWarnings.dwt && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationWarnings.dwt}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="loa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          LOA (m) *
                          {autoFilledValues.loa && (
                            <Badge variant="secondary" className="text-xs">auto</Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="225.0"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleFieldChange("loa", e.target.value);
                            }}
                          />
                        </FormControl>
                        {currentShipType && SHIP_TYPE_RANGES[currentShipType] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatShipRange(SHIP_TYPE_RANGES[currentShipType].loa, "m")}
                          </p>
                        )}
                        {validationWarnings.loa && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationWarnings.loa}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="beam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Beam (m) *
                          {autoFilledValues.beam && (
                            <Badge variant="secondary" className="text-xs">auto</Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="32.2"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleFieldChange("beam", e.target.value);
                            }}
                          />
                        </FormControl>
                        {currentShipType && SHIP_TYPE_RANGES[currentShipType] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatShipRange(SHIP_TYPE_RANGES[currentShipType].beam, "m")}
                          </p>
                        )}
                        {validationWarnings.beam && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationWarnings.beam}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="draft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Draft (m) *
                          {autoFilledValues.draft && (
                            <Badge variant="secondary" className="text-xs">auto</Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="12.5"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleFieldChange("draft", e.target.value);
                            }}
                          />
                        </FormControl>
                        {currentShipType && SHIP_TYPE_RANGES[currentShipType] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatShipRange(SHIP_TYPE_RANGES[currentShipType].draft, "m")}
                          </p>
                        )}
                        {validationWarnings.draft && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationWarnings.draft}
                          </div>
                        )}
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
                          <Combobox
                            options={portState.portOptions}
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              portState.updatePortSelection(
                                value,
                                (port) => form.setValue("portName", port),
                                (terminal) => form.setValue("terminal", terminal),
                                (berth) => form.setValue("berth", berth)
                              );
                            }}
                            placeholder="e.g. Santos"
                            searchPlaceholder="Search ports..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {portState.showTerminalField && (
                    <FormField
                      control={form.control}
                      name="terminal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terminal</FormLabel>
                          <FormControl>
                            <Combobox
                              options={portState.terminalOptions}
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                portState.updateTerminalSelection(
                                  value,
                                  (terminal) => form.setValue("terminal", terminal),
                                  (berth) => form.setValue("berth", berth)
                                );
                              }}
                              placeholder="Select terminal..."
                              searchPlaceholder="Search terminals..."
                              disabled={portState.terminalDisabled}
                            />
                          </FormControl>
                          {portState.terminalHint && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {portState.terminalHint}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {portState.showBerthField && (
                    <FormField
                      control={form.control}
                      name="berth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Berth(s)</FormLabel>
                          <FormControl>
                            <Combobox
                              options={portState.berthOptions}
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                portState.updateBerthSelection(
                                  value,
                                  (berth) => form.setValue("berth", berth)
                                );
                              }}
                              placeholder="Select berth..."
                              searchPlaceholder="Search berths..."
                              disabled={portState.berthDisabled}
                            />
                          </FormControl>
                          {portState.berthHint && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {portState.berthHint}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

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

      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar valores do navio</AlertDialogTitle>
            <AlertDialogDescription>
              Atualizar os valores para o range de {pendingShipType}? Isso irá sobrescrever os valores atuais com as médias do novo tipo de navio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepCurrentValues}>
              Manter meus valores
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateToNewType}>
              Atualizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}