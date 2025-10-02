/*
 * @ai-context
 * Role: FDA Ledger table component - editable grid for AP/AR line items with inline editing,
 *       date pickers, sorting, and filtering by side (AP/AR).
 * DoD:
 * - All ledger entries (including zero-value) must be displayed.
 * - Always use activeOrg.id as tenant_id when creating new lines.
 * - Preserve debounced save logic (400ms delay).
 * - Maintain AP (red) vs AR (green) color coding.
 * Constraints:
 * - If adding columns, update grid layout (grid-cols-X).
 * - Preserve amount_usd → amount_local recalculation on FX change.
 * - Keep date picker in Portal to avoid z-index issues.
 * - Maintain side filter tabs (All, AR, AP).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, ArrowUpDown, ExternalLink, Plus, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FDALedger } from '@/types/fda';
import Decimal from 'decimal.js';
import * as Portal from '@radix-ui/react-portal';
import { useOrg } from '@/context/OrgProvider';
import { getActiveTenantId } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useFDALedgerService } from '@/hooks/useFDALedgerService';

// Type-safe field update value
type FDALedgerFieldValue = string | number | boolean | null;

// Editable fields from FDALedger
type EditableFDALedgerField = 
  | 'description'
  | 'amount_usd'
  | 'invoice_no'
  | 'due_date'
  | 'counterparty'
  | 'category'
  | 'side'
  | 'status';

interface FDALedgerTableProps {
  fdaId: string;
  ledger: FDALedger[];
  exchangeRate: number;
  onLedgerUpdate: (updatedLedger: FDALedger[]) => void;
}

const fmtUSD = (n: number) => formatCurrency(n, 'USD');
const fmtBRL = (n: number) => formatCurrency(n, 'BRL');

export const FDALedgerTable: React.FC<FDALedgerTableProps> = ({
  fdaId,
  ledger,
  exchangeRate,
  onLedgerUpdate
}) => {
  const [fullLedger, setFullLedger] = useState<FDALedger[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: EditableFDALedgerField } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, FDALedgerFieldValue>>({});
  const [sortField, setSortField] = useState<string>('line_no');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openDatePickers, setOpenDatePickers] = useState<Record<string, boolean>>({});
  const [tempUSDValues, setTempUSDValues] = useState<Record<string, string>>({});
  const [tempBRLValues, setTempBRLValues] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const ledgerService = useFDALedgerService();

  // Use ledger as-is, no standard categories bootstrap
  useEffect(() => {
    setFullLedger(ledger);
  }, [ledger]);

  // @ai-editable:start(handleAddLine)
  const handleAddLine = useCallback(async () => {
    if (!activeOrg) {
      toast({
        title: "Error",
        description: "No active organization",
        variant: "destructive",
      });
      return;
    }

    const maxLineNo = fullLedger.reduce((max, line) => Math.max(max, line.line_no), 0);
    const result = await ledgerService.addLine({
      fdaId,
      lineNo: maxLineNo + 1,
      side: 'AP',
      tenantId: getActiveTenantId(activeOrg),
    });

    if (result.success && result.data) {
      const newLedger = [...fullLedger, result.data as FDALedger];
      setFullLedger(newLedger);
      onLedgerUpdate(newLedger);
    }
  }, [fdaId, fullLedger, activeOrg, onLedgerUpdate, ledgerService, toast]);
  // @ai-editable:end

  // Helper: safe numeric parse (empty string -> 0, invalid -> 0)
  const safeParseNumber = (value: FDALedgerFieldValue): number => {
    if (value === null || value === '' || value === undefined) return 0;
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  // Normalize BRL input (Brazilian format: 1.234,56 -> 1234.56)
  const normalizeBRL = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  };

  // Normalize USD input (US format: 1,234.56 -> 1234.56)
  const normalizeUSD = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const normalized = value.replace(/,/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  };

  const saveLineChange = useCallback(async (lineId: string, field: EditableFDALedgerField, value: FDALedgerFieldValue) => {
    const lineIndex = fullLedger.findIndex(l => l.id === lineId);
    if (lineIndex === -1) return;

    const updatedLine = { ...fullLedger[lineIndex] };
    
    // Handle special fields locally
    if (field === 'amount_usd') {
      updatedLine.amount_usd = safeParseNumber(value);
      updatedLine.amount_local = new Decimal(updatedLine.amount_usd).mul(exchangeRate).toNumber();
    } else if (field === 'side') {
      updatedLine.side = value as 'AP' | 'AR';
    } else if (field === 'status') {
      updatedLine.status = value as 'Open' | 'Settled' | 'Partially Settled';
    } else if (field === 'description' || field === 'invoice_no' || field === 'counterparty' || field === 'category') {
      updatedLine[field] = value === null ? undefined : String(value);
    } else if (field === 'due_date') {
      updatedLine.due_date = value === null ? undefined : String(value);
    }

    // Use service to save (handles both insert for new lines and update for existing)
    const result = await ledgerService.updateLineField({
      lineId,
      field,
      value,
      exchangeRate,
    });

    if (result.success) {
      const newFullLedger = [...fullLedger];
      newFullLedger[lineIndex] = updatedLine;
      setFullLedger(newFullLedger);
      onLedgerUpdate(newFullLedger);
    }
  }, [fullLedger, exchangeRate, onLedgerUpdate, ledgerService, safeParseNumber]);

  // Commit USD value on blur
  const commitUSDValue = useCallback(async (lineId: string) => {
    const tempValue = tempUSDValues[lineId];
    if (tempValue === undefined) return;

    const usdValue = normalizeUSD(tempValue);
    await saveLineChange(lineId, 'amount_usd', usdValue);
    
    // Clear temp value
    setTempUSDValues(prev => {
      const newValues = { ...prev };
      delete newValues[lineId];
      return newValues;
    });
  }, [tempUSDValues, saveLineChange]);

  // Commit BRL value on blur
  const commitBRLValue = useCallback(async (lineId: string) => {
    const tempValue = tempBRLValues[lineId];
    if (tempValue === undefined) return;

    const brlValue = normalizeBRL(tempValue);
    const usdValue = exchangeRate > 0 ? brlValue / exchangeRate : 0;
    
    await saveLineChange(lineId, 'amount_usd', usdValue);
    
    // Clear temp value
    setTempBRLValues(prev => {
      const newValues = { ...prev };
      delete newValues[lineId];
      return newValues;
    });
  }, [tempBRLValues, exchangeRate, saveLineChange]);

  // Debounced save for date picker
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  
  const debouncedSave = useCallback((lineId: string, field: EditableFDALedgerField, value: FDALedgerFieldValue) => {
    // Clear existing timeout for this field
    const key = `${lineId}-${field}`;
    if (saveTimeouts[key]) {
      clearTimeout(saveTimeouts[key]);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      saveLineChange(lineId, field, value);
      setSaveTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[key];
        return newTimeouts;
      });
    }, 250);
    
    setSaveTimeouts(prev => ({ ...prev, [key]: timeout }));
  }, [saveLineChange, saveTimeouts]);

  // Debounced save
  useEffect(() => {
    if (editingCell) {
      const timer = setTimeout(() => {
        const value = editValues[`${editingCell.id}-${editingCell.field}`];
        if (value !== undefined) {
          saveLineChange(editingCell.id, editingCell.field, value);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [editValues, editingCell, saveLineChange]);

  const handleCellEdit = (lineId: string, field: EditableFDALedgerField, value: FDALedgerFieldValue) => {
    setEditValues(prev => ({ ...prev, [`${lineId}-${field}`]: value }));
    setEditingCell({ id: lineId, field });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLedger = [...fullLedger].sort((a, b) => {
    let aVal = a[sortField as keyof FDALedger];
    let bVal = b[sortField as keyof FDALedger];
    
    if (sortField === 'due_date') {
      aVal = aVal ? new Date(aVal as string).getTime() : 0;
      bVal = bVal ? new Date(bVal as string).getTime() : 0;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filterLedger = (side?: 'AP' | 'AR') => {
    return side ? sortedLedger.filter(l => l.side === side) : sortedLedger;
  };

  const LedgerRows = ({ data }: { data: FDALedger[] }) => (
    <div className="space-y-1">
      {data.map((line) => {
        // Only "Agency fee" gets green, all others red
        const isAgencyFee = line.category?.toLowerCase() === 'agency fee';
        const rowBgColor = isAgencyFee ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100';
        const datePickerKey = `date-${line.id}`;
        
        return (
          <div
            key={line.id}
            className={`grid grid-cols-8 gap-2 p-2 border rounded-md text-sm ${rowBgColor}`}
          >
            {/* Line # */}
            <div className="text-center font-mono text-gray-600">
              {line.line_no}
            </div>

            {/* Description */}
            <Input
              value={line.description || ''}
              onChange={(e) => handleCellEdit(line.id, 'description', e.target.value)}
              className="h-8"
              placeholder="Description"
            />

            {/* Amount USD */}
            <Input
              value={tempUSDValues[line.id] !== undefined 
                ? tempUSDValues[line.id] 
                : (line.amount_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
              onChange={(e) => setTempUSDValues(prev => ({ ...prev, [line.id]: e.target.value }))}
              onBlur={() => commitUSDValue(line.id)}
              className="h-8 text-right"
              placeholder="0.00"
            />

            {/* Amount BRL */}
            <Input
              value={tempBRLValues[line.id] !== undefined 
                ? tempBRLValues[line.id] 
                : (line.amount_local || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
              onChange={(e) => setTempBRLValues(prev => ({ ...prev, [line.id]: e.target.value }))}
              onBlur={() => commitBRLValue(line.id)}
              className="h-8 text-right"
              placeholder="0,00"
            />

            {/* Invoice # */}
            <Input
              value={line.invoice_no || ''}
              onChange={(e) => handleCellEdit(line.id, 'invoice_no', e.target.value)}
              className="h-8"
              placeholder="Invoice #"
            />

            {/* Due Date - Controlled Popover */}
            <Popover 
              open={openDatePickers[datePickerKey] || false}
              onOpenChange={(open) => {
                setOpenDatePickers(prev => ({ ...prev, [datePickerKey]: open }));
              }}
              modal
            >
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-8 px-2 text-left font-normal w-full"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setOpenDatePickers(prev => ({ ...prev, [datePickerKey]: true }))}
                >
                  {line.due_date ? format(new Date(line.due_date), 'MM/dd/yyyy') : 'Select date'}
                  <Calendar className="ml-auto h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <Portal.Root>
                <PopoverContent 
                  className="w-auto p-0 z-50"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  collisionPadding={8}
                  onPointerDownOutside={(e) => {
                    // Allow closing when clicking outside
                    setOpenDatePickers(prev => ({ ...prev, [datePickerKey]: false }));
                  }}
                  onEscapeKeyDown={() => {
                    setOpenDatePickers(prev => ({ ...prev, [datePickerKey]: false }));
                  }}
                >
                  <CalendarComponent
                    mode="single"
                    selected={line.due_date ? new Date(line.due_date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const isoDate = date.toISOString().split('T')[0];
                        // Update local state immediately
                        const updatedLedger = fullLedger.map(l => 
                          l.id === line.id ? { ...l, due_date: isoDate } : l
                        );
                        setFullLedger(updatedLedger);
                        // Close popover
                        setOpenDatePickers(prev => ({ ...prev, [datePickerKey]: false }));
                        // Debounced save to DB
                        debouncedSave(line.id, 'due_date', isoDate);
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Portal.Root>
            </Popover>

            {/* Paid/Received Checkbox */}
            <div className="flex items-center justify-center">
              <Checkbox
                checked={line.status === 'Settled'}
                onCheckedChange={(checked) => saveLineChange(line.id, 'status', checked ? 'Settled' : 'Open')}
              />
            </div>

            {/* Details Link */}
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => navigate(`/fda/${fdaId}/line/${line.id}`)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Details
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle>Ledger Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Legenda: AP = A pagar (fornecedores) · AR = A receber (cliente)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Column Headers */}
        <div className="grid grid-cols-8 gap-2 p-2 mb-2 text-sm font-medium text-gray-700 bg-gray-50 rounded">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('line_no')}
            className="h-auto p-0 text-left justify-start"
          >
            Line # <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
          <div>Description</div>
          <div>Amount (USD)</div>
          <div>Amount (BRL)</div>
          <div>Invoice #</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('due_date')}
            className="h-auto p-0 text-left justify-start"
          >
            Due Date <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
          <div className="text-center">Paid/Received</div>
          <div className="text-center">Details</div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ar">Receivables (AR)</TabsTrigger>
              <TabsTrigger value="ap">Payables (AP)</TabsTrigger>
            </TabsList>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-semibold">AP (Accounts Payable / A Pagar):</p>
                    <p className="text-sm">Despesas da agência com fornecedores (ex.: praticagem, rebocador, lancha).</p>
                    <p className="font-semibold mt-2">AR (Accounts Receivable / A Receber):</p>
                    <p className="text-sm">Cobranças do cliente (ex.: agency fee, supervision fee, reembolsos).</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <TabsContent value="all">
            <LedgerRows data={filterLedger()} />
          </TabsContent>
          <TabsContent value="ar">
            <LedgerRows data={filterLedger('AR')} />
          </TabsContent>
          <TabsContent value="ap">
            <LedgerRows data={filterLedger('AP')} />
          </TabsContent>
        </Tabs>

        {/* Add Line button below table */}
        <div className="mt-4">
          <Button onClick={handleAddLine} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Line
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};