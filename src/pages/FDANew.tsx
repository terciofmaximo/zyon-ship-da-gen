import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFDA } from "@/hooks/useFDA";
import Decimal from "decimal.js";
import { useOrg } from "@/context/OrgProvider";
import { Combobox } from "@/components/ui/combobox";
import { usePortDirectory } from "@/hooks/usePortDirectory";

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

export default function FDANew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { calculateFDATotals } = useFDA();
  const { activeOrg } = useOrg();
  const [loading, setLoading] = useState(false);
  const portState = usePortDirectory();

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
  });

  const [ledgerLines, setLedgerLines] = useState<LedgerLine[]>([]);

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

  const updateLedgerLine = (id: string, field: string, value: any) => {
    setLedgerLines(lines =>
      lines.map(line =>
        line.id === id ? { ...line, [field]: value } : line
      )
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

    if (!activeOrg) {
      toast({
        title: "Error",
        description: "No active organization",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // Create FDA header
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
        tenant_id: activeOrg.id,
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
          tenant_id: activeOrg.id,
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
              <Label htmlFor="exchange_rate">Exchange Rate (USD/BRL)</Label>
              <Input
                id="exchange_rate"
                type="number"
                step="0.000001"
                value={formData.exchange_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, exchange_rate: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        {ledgerLines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total AP (USD)</div>
                  <div className="text-lg font-semibold text-red-600">
                    ${totals.totalAP_USD.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total AR (USD)</div>
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
                  <div className="text-sm text-muted-foreground">
                    {totals.net_USD >= 0 ? "Due from Client" : "Due to Client"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ledger */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ledger Entries</CardTitle>
              <Button type="button" onClick={addLedgerLine} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
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
                    <TableHead>Side</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount (USD)</TableHead>
                    <TableHead>Amount (BRL)</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Select
                          value={line.side}
                          onValueChange={(value) => updateLedgerLine(line.id, "side", value)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AP">AP</SelectItem>
                            <SelectItem value="AR">AR</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
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
                          type="number"
                          step="0.01"
                          value={line.amount_usd}
                          onChange={(e) => updateLedgerLine(line.id, "amount_usd", parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {calculateAmountLocal(line.amount_usd)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.counterparty}
                          onChange={(e) => updateLedgerLine(line.id, "counterparty", e.target.value)}
                          placeholder="Counterparty"
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{line.status}</Badge>
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
          </CardContent>
        </Card>

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