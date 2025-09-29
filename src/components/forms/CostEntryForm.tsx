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
import { Calculator, Info, AlertCircle, Edit3, DollarSign, Edit, Check } from "lucide-react";
import { ExchangeRateBadge } from "@/components/ui/exchange-rate-badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useItaquiAutoPricing } from "@/hooks/useItaquiAutoPricing";
import type { CostData } from "@/types";
import type { PDAStep1Data } from "@/schemas/pdaSchema";

interface CostEntryFormProps {
  onNext: (data: CostData, remarks?: string, comments?: Record<keyof CostData, string>) => void;
  onBack: () => void;
  shipData: Partial<PDAStep1Data>;
  initialData: Partial<CostData>;
}

interface CostItem {
  id: keyof CostData;
  order: number;
  label: string;
  defaultComment: string;
}

// Fixed 13 cost items with default comments
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

// Utility functions
const normalizeNumber = (value: string): number => {
  if (!value) return 0;
  const normalized = value.replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
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
  });

  // Track which fields are manually edited (to disable auto-pricing for those fields)
  const [manuallyEdited, setManuallyEdited] = useState<Record<string, boolean>>({});

  const [comments, setComments] = useState<Record<keyof CostData, string>>(() => {
    const defaultComments: Record<keyof CostData, string> = {
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
      waterway: "DWT Range x factor tariff. Please see details below"
    };
    return defaultComments;
  });

  const [remarks, setRemarks] = useState<string>(DEFAULT_REMARKS);
  const [isEditingRemarks, setIsEditingRemarks] = useState<boolean>(false);

  const exchangeRate = parseFloat(shipData.exchangeRate || "5.25");

  // Auto-pricing for Itaqui
  const { autoPricingState, disableAutoPricing, getHintText } = useItaquiAutoPricing({
    port: shipData.portName || '',
    terminal: shipData.terminal || '',
    berths: shipData.berth ? [shipData.berth] : [],
    dwt: shipData.dwt || '',
    exchangeRate: shipData.exchangeRate || '',
    onCostsUpdate: (autoCosts, meta) => {
      // Only update costs that haven't been manually edited
      const updatedCosts = { ...costs };
      
      Object.entries(autoCosts).forEach(([key, value]) => {
        const costKey = key as keyof CostData;
        if (!manuallyEdited[costKey] && meta[costKey as keyof typeof meta]?.isAuto) {
          updatedCosts[costKey] = value as number;
        }
      });
      
      setCosts(updatedCosts);
    }
  });

  // Debounced calculation function
  const debouncedCalculation = useCallback(
    debounce((newCosts: CostData) => {
      setCosts(newCosts);
    }, 200),
    []
  );

  const handleCostChange = (field: keyof CostData, value: string) => {
    const numericValue = normalizeNumber(value);
    const newCosts = { ...costs, [field]: numericValue };
    
    // Mark this field as manually edited
    setManuallyEdited(prev => ({ ...prev, [field]: true }));
    
    // Disable auto-pricing for this specific field
    if (['pilotageIn', 'towageIn', 'lightDues'].includes(field)) {
      disableAutoPricing(field as 'pilotageIn' | 'towageIn' | 'lightDues');
    }
    
    debouncedCalculation(newCosts);
  };

  const handleCommentChange = (field: keyof CostData, value: string) => {
    setComments(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(costs, remarks, comments);
  };

  const totalUSD = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
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

      {/* Exchange Rate Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-4 flex-wrap">
          <span>
            <strong>Exchange Rate:</strong> {formatUSD(1)} = {formatBRL(exchangeRate).replace('R$', 'R$')}
          </span>
          <div className="flex items-center gap-2">
            <ExchangeRateBadge
              source={(shipData.exchangeRateSource as "BCB_PTAX_D1" | "MANUAL" | "PROVIDER_X") || 'MANUAL'}
              timestamp={shipData.exchangeRateTimestamp}
            />
            {shipData.exchangeRateTimestamp && (
              <span className="text-sm text-muted-foreground">
                Atualizado: {formatTimestamp(shipData.exchangeRateTimestamp)}
              </span>
            )}
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="ml-auto"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Alterar
          </Button>
        </AlertDescription>
      </Alert>

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
                <TableHead className="min-w-[120px]">Est. Costs - USD</TableHead>
                <TableHead className="min-w-[120px]">Est. Costs - BRL</TableHead>
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
                          value={costs[item.id].toString()}
                          onChange={(e) => handleCostChange(item.id, e.target.value)}
                          className="w-32"
                          placeholder="0.00"
                        />
                        {autoPricingState.meta[item.id as keyof typeof autoPricingState.meta]?.isAuto && (
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
                  <TableCell className="font-mono text-sm currency-cell">
                    {formatBRL(getBRLValue(costs[item.id]))}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={comments[item.id]}
                      onChange={(e) => handleCommentChange(item.id, e.target.value)}
                      className="min-w-[250px] comment-input"
                      placeholder="Comment..."
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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