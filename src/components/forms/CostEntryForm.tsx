import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Calculator, Info, AlertCircle, Edit3, DollarSign, Edit, Check, Plus, Trash2 } from "lucide-react";
import { ExchangeRateBadge } from "@/components/ui/exchange-rate-badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useItaquiAutoPricing } from "@/hooks/useItaquiAutoPricing";
import { useUsdBrlToday } from "@/hooks/useExchangeRate";
import type { CostData, CustomCostLine } from "@/types";
import type { PDAStep1Data } from "@/schemas/pdaSchema";

interface CostEntryFormProps {
  onNext: (data: CostData, remarks?: string, comments?: Record<keyof CostData, string>) => void;
  onBack: () => void;
  shipData: Partial<PDAStep1Data>;
  initialData: Partial<CostData>;
}

interface CostItem {
  id: keyof Omit<CostData, 'customLines'>;
  order: number;
  label: string;
  defaultComment: string;
}

// Fixed 15 cost items with default comments
const COST_ITEMS: CostItem[] = [
  { id: "pilotageIn", order: 1, label: "Pilot IN/OUT", defaultComment: "DWT range tariff +10% for draft ≥11m" },
  { id: "towageIn", order: 2, label: "Towage IN/OUT", defaultComment: "DWT range tariff. For reference only" },
  { id: "lightDues", order: 3, label: "Light dues", defaultComment: "DWT range tariff. Please see details below" },
  { id: "dockage", order: 4, label: "Dockage (Wharfage)", defaultComment: "LOA + 30m x 1.45 x [22] hours alongside" },
  { id: "linesman", order: 5, label: "Linesman (mooring/unmooring)", defaultComment: "Lumpsum charge" },
  { id: "launchBoat", order: 6, label: "Launch boat (mooring/unmooring)", defaultComment: "Lumpsum charge: Inbound launch hire" },
  { id: "immigration", order: 7, label: "Immigration tax (Funapol)", defaultComment: "Inbound immigration processing" },
  { id: "freePratique", order: 8, label: "Free pratique tax", defaultComment: "Sanitary clearance for international arrival" },
  { id: "shippingAssociation", order: 9, label: "Shipping association", defaultComment: "Agency syndicate fee levied per vessel" },
  { id: "clearance", order: 10, label: "Clearance", defaultComment: "Customs & Harbor Master expenses" },
  { id: "paperlessPort", order: 11, label: "Paperless Port System", defaultComment: "Mandatory digital port system fee" },
  { id: "agencyFee", order: 12, label: "Agency fee", defaultComment: "Lumpsum value" },
  { id: "waterway", order: 13, label: "Waterway channel (Table I)", defaultComment: "DWT Range x factor tariff. Please see details below" },
  { id: "iof", order: 14, label: "IOF", defaultComment: "Tax on financial operations" },
  { id: "bankCharges", order: 15, label: "Bank Charges", defaultComment: "Banking fees" },
];

// Agency address for PDF generation (not displayed in this screen)
const AGENCY_ADDRESS = "Rua V09, Nº15, Quadra 11, Parque Shalon, São Luís - MA\nPostal Code: 65073-110 / E-mail: ops.slz@zyonshipping.com.br";

// Default remarks content
const DEFAULT_REMARKS = `**Pilotage IN/OUT** – Pilotage charges as per DWT range. A 10% surcharge applies for vessels with DWT ≥ 100,000 or draft ≥ 11m when berthing.

**Towage IN/OUT**

**Light Dues** – Texto + tabela de faixas DWT/Cost (USD):

| DWT | COST (USD) |
|-----|------------|
| Less than 1,000 | Exempted |
| From 1,000 to 50,000 | $1,500.00 |
| From 50,000 to 100,000 | $2,250.00 |
| Greater than 100,000 | $3,000.00 |

**Dockage (table II)** – Fórmula: (LOA + 30m) × 1.45 × hours alongside + nota sobre cobrança em dobro fora do horário operacional com anuência da Autoridade Portuária.

**Linesman** – Lumpsum.

**Launch boat** – Um lançamento (inbound) no Berth 104; dois (in/out) nos Berths 106/108.

**Immigration tax (Funapol)** – Varia conforme portos anterior e seguinte (estrangeiro/nacional).

**Free pratique tax** – Autoridade sanitária.

**Shipping association tax** – Contribuição obrigatória por navio atendido por agências associadas.

**Clearance** – Custos de trâmites junto à Alfândega e Capitania.

**Paperless Port System** – Uso da plataforma eletrônica obrigatória.

**Agency fee** – Lumpsum para serviços padrão; tarifa oficial vigente: USD 9,804.

**Waterway channel (table I)** – taxa por navegação no canal cobrada pela Autoridade Portuária; variável por faixa de DWT (DWT × fator); responsabilidade usual de embarcadores/recebedores (charter party pode definir).

| DWT | COST (BRL) |
|-----|------------|
| From 0 to 20,000 of DWT | 1,69 |
| From 20,001 to 40,000 of DWT | 1,88 |
| From 40,001 to 60,000 of DWT | 2,00 |
| From 60,001 to 80,000 of DWT | 2,13 |
| Over 80,000 of DWT | 2,25 |`;

// Utility functions for number formatting and parsing

// Normalize USD input (accepts decimal point, comma as thousands separator)
const normalizeUSD = (value: string): number => {
  if (!value) return 0;
  // Remove commas (thousands separator), keep decimal point
  const normalized = value.replace(/,/g, '');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

// Normalize BRL input (accepts comma as decimal, dot as thousands separator)
const normalizeBRL = (value: string): number => {
  if (!value) return 0;
  // Remove dots (thousands separator), convert comma to decimal point
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

// Format number for USD display (1,234.56)
const formatUSDNumber = (value: number): string => {
  if (value === 0) return '';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Format number for BRL display (1.234,56)
const formatBRLNumber = (value: number): string => {
  if (value === 0) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatUSD = (value: number): string => {
  return value.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
};

const formatBRL = (value: number): string => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
};

const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }) + ' (BRT)';
  } catch {
    return '';
  }
};

export function CostEntryForm({ onNext, onBack, shipData, initialData }: CostEntryFormProps) {
  const [costs, setCosts] = useState<CostData>({
    pilotageIn: initialData.pilotageIn || 0,
    towageIn: initialData.towageIn || 0,
    lightDues: initialData.lightDues || 0,
    dockage: initialData.dockage || 0,
    linesman: initialData.linesman || 0,
    launchBoat: initialData.launchBoat || 0,
    immigration: initialData.immigration || 0,
    freePratique: initialData.freePratique || 0,
    shippingAssociation: initialData.shippingAssociation || 0,
    clearance: initialData.clearance || 0,
    paperlessPort: initialData.paperlessPort || 0,
    agencyFee: initialData.agencyFee || 9804,
    waterway: initialData.waterway || 0,
    iof: initialData.iof || 0,
    bankCharges: initialData.bankCharges || 0,
    customLines: initialData.customLines || [],
  });

  const [customLines, setCustomLines] = useState<CustomCostLine[]>(initialData.customLines || []);

  // Track which fields are manually edited (to disable auto-pricing for those fields)
  const [manuallyEdited, setManuallyEdited] = useState<Record<string, boolean>>({});
  
  // Track temporary BRL input values (for controlled input without conversion issues)
  const [tempBRLValues, setTempBRLValues] = useState<Record<string, string>>({});
  const [tempCustomBRLValues, setTempCustomBRLValues] = useState<Record<string, string>>({});
  const [tempUSDValues, setTempUSDValues] = useState<Record<string, string>>({});
  const [tempCustomUSDValues, setTempCustomUSDValues] = useState<Record<string, string>>({});

  const [comments, setComments] = useState<Record<string, string>>(() => {
    const defaultComments: Record<string, string> = {
      pilotageIn: "DWT range tariff +10% for draft ≥11m",
      towageIn: "DWT range tariff. For reference only",
      lightDues: "DWT range tariff. Please see details below",
      dockage: "LOA + 30m x 1.45 x [22] hours alongside",
      linesman: "Lumpsum charge",
      launchBoat: "Lumpsum charge: Inbound launch hire",
      immigration: "Inbound immigration processing",
      freePratique: "Sanitary clearance for international arrival",
      shippingAssociation: "Agency syndicate fee levied per vessel",
      clearance: "Customs & Harbor Master expenses",
      paperlessPort: "Mandatory digital port system fee",
      agencyFee: "Lumpsum value",
      waterway: "DWT Range x factor tariff. Please see details below",
      iof: "Tax on financial operations",
      bankCharges: "Banking fees"
    };
    return defaultComments;
  });

  const [remarks, setRemarks] = useState<string>(DEFAULT_REMARKS);
  const [isEditingRemarks, setIsEditingRemarks] = useState<boolean>(false);

  const [localExchangeRate, setLocalExchangeRate] = useState<string>(shipData.exchangeRate || "5.25");
  const [exchangeRateSource, setExchangeRateSource] = useState<string>(shipData.exchangeRateSource || "MANUAL");
  const [exchangeRateTimestamp, setExchangeRateTimestamp] = useState<string>(shipData.exchangeRateTimestamp || "");

  const { data: ptaxData, loading: ptaxLoading, error: ptaxError, refresh: refreshPtax } = useUsdBrlToday(false);

  const exchangeRate = parseFloat(localExchangeRate || "5.25");

  const fetchExchangeRate = async () => {
    await refreshPtax();
    if (ptaxData) {
      setLocalExchangeRate(ptaxData.rate.toFixed(4));
      setExchangeRateSource(ptaxData.source);
      setExchangeRateTimestamp(ptaxData.ts);
    }
  };

  useEffect(() => {
    if (ptaxData && ptaxLoading === false) {
      setLocalExchangeRate(ptaxData.rate.toFixed(4));
      setExchangeRateSource(ptaxData.source);
      setExchangeRateTimestamp(ptaxData.ts);
    }
  }, [ptaxData, ptaxLoading]);

  const handleExchangeRateChange = (value: string) => {
    setLocalExchangeRate(value);
    setExchangeRateSource("MANUAL");
    setExchangeRateTimestamp("");
  };

  // Auto-pricing for Itaqui
  const { autoPricingState, disableAutoPricing, getHintText } = useItaquiAutoPricing({
    port: shipData.portName || '',
    terminal: shipData.terminal || '',
    berths: shipData.berth ? [shipData.berth] : [],
    dwt: shipData.dwt || '',
    exchangeRate: localExchangeRate,
    onCostsUpdate: (autoCosts, meta) => {
      // Only update costs that haven't been manually edited
      setCosts(prevCosts => {
        const updatedCosts = { ...prevCosts };
        
        Object.entries(autoCosts).forEach(([key, value]) => {
          const costKey = key as keyof Omit<CostData, 'customLines'>;
          // Only auto-update if not manually edited
          if (!manuallyEdited[costKey] && meta[costKey as keyof typeof meta]?.isAuto) {
            updatedCosts[costKey] = value as number;
          }
        });
        
        return updatedCosts;
      });
    }
  });

  // Debounced calculation function
  const debouncedCalculation = useCallback(
    debounce((newCosts: CostData) => {
      setCosts(newCosts);
    }, 200),
    []
  );

  const handleCostChange = (field: keyof Omit<CostData, 'customLines'>, value: string) => {
    // Store the temporary USD value for display
    setTempUSDValues(prev => ({ ...prev, [field]: value }));
    
    const numericValue = normalizeUSD(value);
    const newCosts = { ...costs, [field]: numericValue };
    
    // Clear temp BRL value when USD is edited
    setTempBRLValues(prev => ({ ...prev, [field]: '' }));
    
    // Mark this field as manually edited
    setManuallyEdited(prev => ({ ...prev, [field]: true }));
    
    // Disable auto-pricing for this specific field
    if (['pilotageIn', 'towageIn', 'lightDues'].includes(field)) {
      disableAutoPricing(field as 'pilotageIn' | 'towageIn' | 'lightDues');
    }
    
    debouncedCalculation(newCosts);
  };

  const handleBRLChange = (field: keyof Omit<CostData, 'customLines'>, brlValue: string) => {
    // Store the temporary BRL value for display only (do not convert while typing)
    setTempBRLValues(prev => ({ ...prev, [field]: brlValue }));

    // Clear temp USD value when BRL is edited to avoid conflicting displays
    setTempUSDValues(prev => ({ ...prev, [field]: '' }));

    // Mark this field as manually edited
    setManuallyEdited(prev => ({ ...prev, [field]: true }));

    // Disable auto-pricing for this specific field
    if (['pilotageIn', 'towageIn', 'lightDues'].includes(field)) {
      disableAutoPricing(field as 'pilotageIn' | 'towageIn' | 'lightDues');
    }
  };

  // Commit BRL input on blur: convert to USD and update costs
  const commitBRLValue = (field: keyof Omit<CostData, 'customLines'>) => {
    const current = tempBRLValues[field] ?? '';
    const numericBRL = normalizeBRL(current);
    const usdValue = exchangeRate ? (numericBRL / exchangeRate) : 0;

    setCosts(prev => ({ ...prev, [field]: usdValue }));
    setTempBRLValues(prev => ({ ...prev, [field]: '' }));
  };

  // Commit custom BRL input on blur
  const commitCustomBRLValue = (id: string) => {
    const current = tempCustomBRLValues[id] ?? '';
    const numericBRL = normalizeBRL(current);
    const usdValue = exchangeRate ? (numericBRL / exchangeRate) : 0;

    setCustomLines(prev => prev.map(line => (
      line.id === id ? { ...line, costUSD: usdValue } : line
    )));

    setTempCustomBRLValues(prev => ({ ...prev, [id]: '' }));
    setTempCustomUSDValues(prev => ({ ...prev, [id]: '' }));
  };

  const handleCommentChange = (field: string, value: string) => {
    setComments(prev => ({ ...prev, [field]: value }));
  };

  // Helper to commit values on Tab key press
  const handleTabKey = (e: React.KeyboardEvent, commitFn: () => void) => {
    if (e.key === 'Tab') {
      commitFn();
    }
  };

  const handleAddCustomLine = () => {
    const newLine: CustomCostLine = {
      id: `custom_${Date.now()}`,
      label: '',
      costUSD: 0,
      comment: ''
    };
    setCustomLines([...customLines, newLine]);
  };

  const handleRemoveCustomLine = (id: string) => {
    setCustomLines(customLines.filter(line => line.id !== id));
  };

  const handleCustomLineChange = (id: string, field: keyof CustomCostLine, value: string | number) => {
    // When editing USD, clear only the BRL temp to avoid interfering with typing in USD
    if (field === 'costUSD') {
      setTempCustomBRLValues(prev => ({ ...prev, [id]: '' }));
    }
    
    setCustomLines(customLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costsWithCustomLines = { ...costs, customLines };
    
    // Update shipData with the current exchange rate
    shipData.exchangeRate = localExchangeRate;
    shipData.exchangeRateSource = exchangeRateSource as "BCB_PTAX_D1" | "MANUAL" | "PROVIDER_X";
    shipData.exchangeRateTimestamp = exchangeRateTimestamp;
    
    onNext(costsWithCustomLines, remarks, comments);
  };

  const fixedCostsTotal = Object.entries(costs)
    .filter(([key]) => key !== 'customLines')
    .reduce((sum, [, cost]) => sum + (typeof cost === 'number' ? cost : 0), 0);
  
  const customLinesTotal = customLines.reduce((sum, line) => sum + line.costUSD, 0);
  const totalUSD = fixedCostsTotal + customLinesTotal;
  const totalBRL = totalUSD * exchangeRate;

  const getBRLValue = (usdValue: number): number => {
    return usdValue * exchangeRate;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-pricing warnings */}
      {autoPricingState.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {autoPricingState.warnings.map((warning, index) => (
              <div key={index} className="text-sm">
                {warning}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Exchange Rate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Exchange Rate (USD/BRL)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1">
              <Label htmlFor="exchangeRate" className="mb-2 flex items-center gap-2">
                Exchange Rate *
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={fetchExchangeRate}
                  disabled={ptaxLoading}
                >
                  {ptaxLoading ? "Buscando..." : "Usar taxa de hoje"}
                </Button>
              </Label>
              <div className="space-y-2">
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.0001"
                  value={localExchangeRate}
                  onChange={(e) => handleExchangeRateChange(e.target.value)}
                  placeholder="Ex.: 5.4321"
                  className="max-w-xs"
                />
                {ptaxError ? (
                  <p className="text-xs text-destructive">Falha ao buscar PTAX</p>
                ) : ptaxData ? (
                  <p className="text-xs text-muted-foreground">
                    PTAX (compra) • {new Date(ptaxData.ts).toLocaleString('pt-BR')} • Fonte: BCB
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <ExchangeRateBadge
                      source={(exchangeRateSource as "BCB_PTAX_D1" | "MANUAL" | "PROVIDER_X") || 'MANUAL'}
                      timestamp={exchangeRateTimestamp}
                    />
                    {exchangeRateTimestamp && (
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(exchangeRateTimestamp)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Alert className="flex-1">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Conversão:</strong> {formatUSD(1)} = {formatBRL(exchangeRate)}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Main Cost Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Port Expenses - {shipData.vesselName}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="table-compact">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Nº</TableHead>
                <TableHead className="min-w-[200px]">Port Expenses</TableHead>
                <TableHead className="min-w-[140px]">Est. Costs - USD</TableHead>
                <TableHead className="min-w-[140px]">Est. Costs - BRL</TableHead>
                <TableHead className="min-w-[300px]">Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COST_ITEMS.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-center">
                    {item.order}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.label}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <Input
                          type="text"
                          value={
                            tempUSDValues[item.id] !== undefined && tempUSDValues[item.id] !== ''
                              ? tempUSDValues[item.id]
                              : formatUSDNumber(costs[item.id])
                          }
                          onChange={(e) => handleCostChange(item.id, e.target.value)}
                          onBlur={() => setTempUSDValues(prev => ({ ...prev, [item.id]: '' }))}
                          onKeyDown={(e) => handleTabKey(e, () => setTempUSDValues(prev => ({ ...prev, [item.id]: '' })))}
                          className="w-32"
                          placeholder="0.00"
                        />
                        {autoPricingState.meta[item.id as keyof typeof autoPricingState.meta]?.isAuto && !manuallyEdited[item.id] && (
                          <Badge variant="secondary" className="text-xs">auto</Badge>
                        )}
                      </div>
                      {['pilotageIn', 'towageIn', 'lightDues'].includes(item.id) && getHintText(item.id as 'pilotageIn' | 'towageIn' | 'lightDues') && (
                        <p className="text-xs text-muted-foreground">
                          {getHintText(item.id as 'pilotageIn' | 'towageIn' | 'lightDues')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <Input
                        type="text"
                        value={
                          tempBRLValues[item.id] !== undefined && tempBRLValues[item.id] !== '' 
                            ? tempBRLValues[item.id]
                            : formatBRLNumber(costs[item.id] * exchangeRate)
                        }
                        onChange={(e) => handleBRLChange(item.id, e.target.value)}
                        onBlur={() => commitBRLValue(item.id)}
                        onKeyDown={(e) => handleTabKey(e, () => commitBRLValue(item.id))}
                        className="w-32"
                        placeholder="0,00"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={comments[item.id] || ''}
                      onChange={(e) => handleCommentChange(item.id, e.target.value)}
                      className="min-w-[250px] comment-input"
                      placeholder="Comment..."
                    />
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Custom Lines */}
              {customLines.map((line, index) => (
                <TableRow key={line.id} className="bg-muted/20">
                  <TableCell className="font-medium text-center">
                    {COST_ITEMS.length + index + 1}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={line.label}
                      onChange={(e) => handleCustomLineChange(line.id, 'label', e.target.value)}
                      placeholder="Custom expense name"
                      className="min-w-[180px]"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <Input
                        type="text"
                        value={
                          tempCustomUSDValues[line.id] !== undefined && tempCustomUSDValues[line.id] !== ''
                            ? tempCustomUSDValues[line.id]
                            : formatUSDNumber(line.costUSD)
                        }
                        onChange={(e) => {
                          setTempCustomUSDValues(prev => ({ ...prev, [line.id]: e.target.value }));
                          handleCustomLineChange(line.id, 'costUSD', normalizeUSD(e.target.value));
                        }}
                        onBlur={() => setTempCustomUSDValues(prev => ({ ...prev, [line.id]: '' }))}
                        onKeyDown={(e) => handleTabKey(e, () => setTempCustomUSDValues(prev => ({ ...prev, [line.id]: '' })))}
                        className="w-32"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <Input
                        type="text"
                        value={
                          tempCustomBRLValues[line.id] !== undefined && tempCustomBRLValues[line.id] !== ''
                            ? tempCustomBRLValues[line.id]
                            : formatBRLNumber(line.costUSD * exchangeRate)
                        }
                        onChange={(e) => {
                          setTempCustomBRLValues(prev => ({ ...prev, [line.id]: e.target.value }));
                        }}
                        onBlur={() => commitCustomBRLValue(line.id)}
                        onKeyDown={(e) => handleTabKey(e, () => commitCustomBRLValue(line.id))}
                        className="w-32"
                        placeholder="0,00"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={line.comment}
                        onChange={(e) => handleCustomLineChange(line.id, 'comment', e.target.value)}
                        className="min-w-[250px] comment-input"
                        placeholder="Comment..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomLine(line.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Add Custom Line Button */}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomLine}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Line
            </Button>
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-end">
              <div className="grid grid-cols-2 gap-4 w-64">
                <div className="text-right">
                  <Label className="text-sm font-semibold">Total USD:</Label>
                  <div className="text-lg font-bold text-primary">
                    {formatUSD(totalUSD)}
                  </div>
                </div>
                <div className="text-right">
                  <Label className="text-sm font-semibold">Total BRL:</Label>
                  <div className="text-lg font-bold text-accent">
                    {formatBRL(totalBRL)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>This communication is confidential and intended for the designated recipient(s) only. Unauthorized use or disclosure is strictly prohibited.</strong>
        </AlertDescription>
      </Alert>

      {/* Remarks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Remarks</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditingRemarks(!isEditingRemarks)}
          >
            {isEditingRemarks ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Done
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditingRemarks ? (
            <>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Enter remarks here..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                You can edit the remarks above. Markdown formatting is supported for tables and formatting.
              </p>
            </>
          ) : (
            <div className="remarks-preview prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {remarks}
              </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
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

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}