/*
 * @ai-context
 * Role: FDA creation page (direct entry) - allows creating FDA with manual ledger entry without PDA.
 * DoD:
 * - Create FDA directly without requiring a PDA (pda_id is nullable).
 * - Always use activeOrg.id as tenant_id for FDA and ledger entries.
 * - Initialize with 13 standard cost items from INITIAL_LEDGER_LINES.
 * - Calculate totals dynamically (AP, AR, Net).
 * - Vessel fields (DWT, LOA, Beam) are optional.
 * Constraints:
 * - Direct FDA creation: FDA header → Ledger entries (no PDA dependency).
 * - If adding ledger fields, update both state and insert mapping.
 * - Preserve exchange rate logic (USD ↔ BRL conversion).
 * - Keep financial precision (use Decimal.js for calculations).
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, AlertCircle, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFDA } from "@/hooks/useFDA";
import Decimal from "decimal.js";
import { useOrg } from "@/context/OrgProvider";
import { getActiveTenantId } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { usePortDirectory } from "@/hooks/usePortDirectory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserRole } from "@/hooks/useUserRole";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUsdBrlToday } from "@/hooks/useExchangeRate";
import { normalizeNumericInput } from "@/utils/pdaValidationUtils";

interface LedgerLine {
  id: string;
  side: "AP" | "AR";
  category: string;
  description: string;
  amount_usd: number;
  counterparty: string;
  invoice_no?: string;
  due_date?: string;
  status: "Open" | "Settled" | "Partially Settled";
}

// Type-safe field update value for LedgerLine
type LedgerLineFieldValue = string | number;

// Editable fields from LedgerLine
type EditableLedgerLineField = keyof LedgerLine;

// Fixed 13 cost items matching PDA Cost Entry
const INITIAL_LEDGER_LINES: Omit<LedgerLine, "id">[] = [
  { side: "AP", category: "Pilot IN/OUT", description: "Pilot IN/OUT", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Towage IN/OUT", description: "Towage IN/OUT", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Light dues", description: "Light dues", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Dockage (Wharfage)", description: "Dockage (Wharfage)", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Linesman (mooring/unmooring)", description: "Linesman (mooring/unmooring)", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Launch boat (mooring/unmooring)", description: "Launch boat (mooring/unmooring)", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Immigration tax (Funapol)", description: "Immigration tax (Funapol)", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Free pratique tax", description: "Free pratique tax", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Shipping association", description: "Shipping association", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Clearance", description: "Clearance", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AP", category: "Paperless Port System", description: "Paperless Port System", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
  { side: "AR", category: "Agency fee", description: "Agency fee", amount_usd: 0, counterparty: "Client", status: "Open" },
  { side: "AP", category: "Waterway channel (Table I)", description: "Waterway channel (Table I)", amount_usd: 0, counterparty: "Vendor — to assign", status: "Open" },
];

export default function FDANew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { calculateFDATotals } = useFDA();
  const { activeOrg, organizations } = useOrg();
  const { isPlatformAdmin } = useUserRole();
  const [loading, setLoading] = useState(false);
  const portState = usePortDirectory();
  const { data: ptaxData, loading: ptaxLoading, error: ptaxError, refresh: refreshPtax } = useUsdBrlToday(true);

  // Form state
  const [formData, setFormData] = useState({
    client_name: "",
    port: "",
    terminal: "",
    berth: "",
    currency_base: "USD",
    currency_local: "BRL",
    exchange_rate: "5.25",
    vessel_name: "",
    imo: "",
    dwt: "",
    loa: "",
    beam: "",
  });

  const [receivedFromClient, setReceivedFromClient] = useState(0);

  const [ledgerLines, setLedgerLines] = useState<LedgerLine[]>(() => 
    INITIAL_LEDGER_LINES.map((line, index) => ({
      ...line,
      id: `initial_${index}`
    }))
  );

  const [tempLedgerUSD, setTempLedgerUSD] = useState<Record<string, string>>({});

  // Auto-fill exchange rate when PTAX data is available
  useEffect(() => {
    if (ptaxData && !formData.exchange_rate) {
      setFormData(prev => ({ ...prev, exchange_rate: ptaxData.rate.toFixed(4) }));
    }
  }, [ptaxData]);

  const addLedgerLine = () => {
    const newLine: LedgerLine = {
      id: `temp_${Date.now()}`,
      side: "AR",
      category: "",
      description: "",
      amount_usd: 0,
      counterparty: "",
      status: "Open",
    };
    setLedgerLines([...ledgerLines, newLine]);
  };

  // Helper: safe numeric parse (empty string -> 0, invalid -> 0)
  const safeParseNumber = (value: LedgerLineFieldValue): number => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  const updateLedgerLine = (id: string, field: EditableLedgerLineField, value: LedgerLineFieldValue) => {
    setLedgerLines(lines =>
      lines.map(line => {
        if (line.id !== id) return line;
        
        // Type-safe field updates
        if (field === 'amount_usd') {
          return { ...line, amount_usd: safeParseNumber(value) };
        } else if (field === 'side') {
          return { ...line, side: value as 'AP' | 'AR' };
        } else if (field === 'status') {
          return { ...line, status: value as 'Open' | 'Settled' | 'Partially Settled' };
        } else if (field === 'category' || field === 'description' || field === 'counterparty' || field === 'invoice_no' || field === 'due_date') {
          return { ...line, [field]: String(value) };
        }
        
        return line;
      })
    );
  };

  const removeLedgerLine = (id: string) => {
    setLedgerLines(lines => lines.filter(line => line.id !== id));
  };

  const calculateAmountLocal = (amountUsd: number) => {
    const rate = new Decimal(formData.exchange_rate || "1");
    return new Decimal(amountUsd).mul(rate).toFixed(2);
  };

  const calculateTotals = () => {
    const ledger = ledgerLines.map(line => ({
      side: line.side,
      amount_usd: line.amount_usd,
      amount_local: parseFloat(calculateAmountLocal(line.amount_usd)),
    }));

    return calculateFDATotals(ledger as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name.trim() || !formData.port.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name and port are required",
        variant: "destructive",
      });
      return;
    }

    // Check for active organization
    if (!activeOrg) {
      // Special handling for platform admins
      if (isPlatformAdmin && organizations.length > 0) {
        toast({
          title: "Select Organization",
          description: "Please select an organization from the switcher to create an FDA",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Organization",
          description: "You need to be part of an organization to create an FDA",
          variant: "destructive",
        });
      }
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // Create FDA directly without PDA
      const fdaData = {
        pda_id: null,
        status: "Draft" as const,
        client_name: formData.client_name,
        vessel_name: formData.vessel_name || null,
        imo: formData.imo || null,
        port: formData.port,
        terminal: formData.terminal || null,
        currency_base: formData.currency_base,
        currency_local: formData.currency_local,
        exchange_rate: parseFloat(formData.exchange_rate),
        created_by: user.id,
        tenant_id: getActiveTenantId(activeOrg),
        meta: {
          received_from_client_usd: receivedFromClient || 0,
        },
      };

      const { data: newFda, error: fdaError } = await supabase
        .from("fda")
        .insert(fdaData)
        .select()
        .single();

      if (fdaError) throw fdaError;

      // Create ledger entries
      if (ledgerLines.length > 0) {
        const ledgerEntries = ledgerLines.map((line, index) => ({
          fda_id: newFda.id,
          line_no: index + 1,
          side: line.side,
          category: line.category,
          description: line.description,
          counterparty: line.counterparty,
          amount_usd: line.amount_usd,
          amount_local: parseFloat(calculateAmountLocal(line.amount_usd)),
          invoice_no: line.invoice_no || null,
          due_date: line.due_date || null,
          status: line.status,
          tenant_id: getActiveTenantId(activeOrg),
        }));

        const { error: ledgerError } = await supabase
          .from("fda_ledger")
          .insert(ledgerEntries);

        if (ledgerError) throw ledgerError;
      }

      toast({
        title: "Success",
        description: "FDA created successfully",
      });

      navigate(`/fda/${newFda.id}`);
    } catch (error) {
      console.error("Error creating FDA:", error);
      toast({
        title: "Error",
        description: "Failed to create FDA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 space-y-6">
      {/* Warning if no active org */}
      {!activeOrg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isPlatformAdmin 
              ? "Please select an organization from the Organization Switcher to create an FDA"
              : "You need to be part of an organization to create an FDA"}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New FDA</h1>
          <p className="text-muted-foreground">Create a Final Disbursement Account</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/fda")}>
          Back to List
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <CardTitle>FDA Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="port">Port *</Label>
              <Combobox
                options={portState.portOptions}
                value={formData.port}
                onValueChange={(value) => {
                  portState.updatePortSelection(
                    value,
                    (port) => setFormData(prev => ({ ...prev, port })),
                    (terminal) => setFormData(prev => ({ ...prev, terminal })),
                    (berth) => setFormData(prev => ({ ...prev, berth }))
                  );
                }}
                placeholder="Select port..."
                searchPlaceholder="Search ports..."
              />
            </div>
            <div>
              <Label htmlFor="terminal">Terminal</Label>
              <Combobox
                options={portState.terminalOptions}
                value={formData.terminal}
                onValueChange={(value) => {
                  portState.updateTerminalSelection(
                    value,
                    (terminal) => setFormData(prev => ({ ...prev, terminal })),
                    (berth) => setFormData(prev => ({ ...prev, berth }))
                  );
                }}
                placeholder="Select terminal..."
                searchPlaceholder="Search terminals..."
                disabled={portState.terminalDisabled}
              />
              {portState.terminalHint && (
                <p className="text-sm text-muted-foreground mt-1">{portState.terminalHint}</p>
              )}
            </div>
            <div>
              <Label htmlFor="berth">Berth</Label>
              <Combobox
                options={portState.berthOptions}
                value={formData.berth}
                onValueChange={(value) => {
                  portState.updateBerthSelection(
                    value,
                    (berth) => setFormData(prev => ({ ...prev, berth }))
                  );
                }}
                placeholder="Select berth..."
                searchPlaceholder="Search berths..."
                disabled={portState.berthDisabled}
              />
              {portState.berthHint && (
                <p className="text-sm text-muted-foreground mt-1">{portState.berthHint}</p>
              )}
            </div>
            <div>
              <Label htmlFor="vessel_name">Vessel Name</Label>
              <Input
                id="vessel_name"
                value={formData.vessel_name}
                onChange={(e) => setFormData(prev => ({ ...prev, vessel_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="imo">IMO Number</Label>
              <Input
                id="imo"
                value={formData.imo}
                onChange={(e) => setFormData(prev => ({ ...prev, imo: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dwt">DWT (Deadweight Tonnage)</Label>
              <Input
                id="dwt"
                value={formData.dwt}
                onChange={(e) => setFormData(prev => ({ ...prev, dwt: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="loa">LOA (Length Overall)</Label>
              <Input
                id="loa"
                value={formData.loa}
                onChange={(e) => setFormData(prev => ({ ...prev, loa: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="beam">Beam</Label>
              <Input
                id="beam"
                value={formData.beam}
                onChange={(e) => setFormData(prev => ({ ...prev, beam: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="exchange_rate" className="flex items-center gap-2">
                Exchange Rate (USD/BRL)
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={async () => {
                    await refreshPtax();
                    if (ptaxData) {
                      setFormData(prev => ({ ...prev, exchange_rate: ptaxData.rate.toFixed(4) }));
                    }
                  }}
                  disabled={ptaxLoading}
                >
                  {ptaxLoading ? "Buscando..." : "Usar taxa de hoje"}
                </Button>
              </Label>
              <Input
                id="exchange_rate"
                type="number"
                step="0.0001"
                value={formData.exchange_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, exchange_rate: e.target.value }))}
                placeholder="Ex.: 5.4321"
              />
              {ptaxError ? (
                <p className="text-xs text-destructive mt-1">Falha ao buscar PTAX</p>
              ) : ptaxData ? (
                <p className="text-xs text-muted-foreground mt-1">
                  PTAX (compra) • {new Date(ptaxData.ts).toLocaleString('pt-BR')} • Fonte: BCB
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Ledger */}
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Ledger Entries</CardTitle>
              <p className="text-sm text-muted-foreground">
                Legenda: AP = A pagar (fornecedores) · AR = A receber (cliente)
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {ledgerLines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No ledger entries yet. Click "Add Line" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount (USD)</TableHead>
                    <TableHead>Amount (BRL)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Input
                          value={line.category}
                          onChange={(e) => updateLedgerLine(line.id, "category", e.target.value)}
                          placeholder="Category"
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLedgerLine(line.id, "description", e.target.value)}
                          placeholder="Description"
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={
                            tempLedgerUSD[line.id] !== undefined && tempLedgerUSD[line.id] !== ''
                              ? tempLedgerUSD[line.id]
                              : (line.amount_usd ? line.amount_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            setTempLedgerUSD(prev => ({ ...prev, [line.id]: v }));
                            const num = normalizeNumericInput(v, 'en-US');
                            updateLedgerLine(line.id, 'amount_usd', num);
                          }}
                          onBlur={() => setTempLedgerUSD(prev => ({ ...prev, [line.id]: '' }))}
                          className="w-24"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {calculateAmountLocal(line.amount_usd)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLedgerLine(line.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {/* Add Line button below table */}
            <div className="mt-4">
              <Button type="button" onClick={addLedgerLine} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        {ledgerLines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Payable (USD)</div>
                  <div className="text-lg font-semibold text-red-600">
                    ${totals.totalAP_USD.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Receivable (USD)</div>
                  <div className="text-lg font-semibold text-green-600">
                    ${totals.totalAR_USD.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Net (USD)</div>
                  <div className={`text-lg font-semibold ${
                    totals.net_USD >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}>
                    ${Math.abs(totals.net_USD).toFixed(2)}
                    {totals.net_USD < 0 && " (owe)"}
                  </div>
                </div>
                <div>
                  <Label htmlFor="received_from_client" className="text-sm text-muted-foreground">
                    Amount Received as Cash Advance (USD)
                  </Label>
                  <Input
                    id="received_from_client"
                    type="number"
                    step="0.01"
                    min="0"
                    value={receivedFromClient}
                    onChange={(e) => setReceivedFromClient(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="text-sm text-muted-foreground">Amount Due from Client (USD)</div>
                <div className="text-lg font-semibold">
                  ${Math.max(0, totals.net_USD - receivedFromClient).toFixed(2)}
                </div>
                {receivedFromClient > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Considering ${receivedFromClient.toFixed(2)} already received
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/fda")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create FDA"}
          </Button>
        </div>
      </form>
    </div>
  );
}