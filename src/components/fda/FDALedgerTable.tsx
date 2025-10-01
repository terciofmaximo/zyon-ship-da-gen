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
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState<string>('line_no');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openDatePickers, setOpenDatePickers] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeOrg } = useOrg();

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

    try {
      // Get max line_no
      const maxLineNo = fullLedger.reduce((max, line) => Math.max(max, line.line_no), 0);
      const newLineNo = maxLineNo + 1;

      // @ai-guard:start - tenant_id must use activeOrg
      // Create new line in DB
      const { data, error } = await supabase
        .from('fda_ledger')
        .insert({
          fda_id: fdaId,
          line_no: newLineNo,
          side: 'AP',
          category: 'New Item',
          description: 'New line item',
          counterparty: 'Vendor — to assign',
          amount_usd: 0,
          amount_local: 0,
          status: 'Open',
          tenant_id: getActiveTenantId(activeOrg),
          origin: 'MANUAL',
        })
        .select()
        .single();
      // @ai-guard:end

      if (error) throw error;

      const newLedger = [...fullLedger, data as FDALedger];
      setFullLedger(newLedger);
      onLedgerUpdate(newLedger);

      toast({
        title: "Line added",
        description: "New line item created successfully",
      });
    } catch (error) {
      console.error('Failed to add line:', error);
      toast({
        title: "Error",
        description: "Failed to add line item",
        variant: "destructive",
      });
    }
  }, [fdaId, fullLedger, activeOrg, onLedgerUpdate, toast]);
  // @ai-editable:end

  const saveLineChange = useCallback(async (lineId: string, field: string, value: any) => {
    try {
      const lineIndex = fullLedger.findIndex(l => l.id === lineId);
      if (lineIndex === -1) return;

      const updatedLine = { ...fullLedger[lineIndex] };
      
      // Handle special fields
      if (field === 'amount_usd') {
        updatedLine.amount_usd = parseFloat(value) || 0;
        updatedLine.amount_local = new Decimal(updatedLine.amount_usd).mul(exchangeRate).toNumber();
      } else if (field === 'paid') {
        updatedLine.status = value ? 'Settled' : 'Open';
        if (value) {
          updatedLine.settled_at = new Date().toISOString();
        }
      } else {
        (updatedLine as any)[field] = value;
      }

      // If this is a new standard line, insert into database
      if (lineId.startsWith('standard-')) {
        if (!activeOrg) throw new Error("No active organization");
        
        const { data, error } = await supabase
          .from('fda_ledger')
          .insert({
            fda_id: fdaId,
            line_no: updatedLine.line_no,
            side: updatedLine.side,
            category: updatedLine.category,
            description: updatedLine.description,
            counterparty: updatedLine.counterparty,
            amount_usd: updatedLine.amount_usd,
            amount_local: updatedLine.amount_local,
            invoice_no: updatedLine.invoice_no,
            due_date: updatedLine.due_date,
            status: updatedLine.status,
            tenant_id: getActiveTenantId(activeOrg),
          })
          .select()
          .single();

        if (error) throw error;
        updatedLine.id = data.id;
      } else {
        // Update existing line
        const { error } = await supabase
          .from('fda_ledger')
          .update({
            side: updatedLine.side,
            category: updatedLine.category,
            description: updatedLine.description,
            counterparty: updatedLine.counterparty,
            amount_usd: updatedLine.amount_usd,
            amount_local: updatedLine.amount_local,
            invoice_no: updatedLine.invoice_no,
            due_date: updatedLine.due_date,
            status: updatedLine.status,
            settled_at: field === 'paid' ? (value ? new Date().toISOString() : null) : undefined,
          })
          .eq('id', lineId);

        if (error) throw error;
      }

      const newFullLedger = [...fullLedger];
      newFullLedger[lineIndex] = updatedLine;
      setFullLedger(newFullLedger);
      onLedgerUpdate(newFullLedger);
      
    } catch (error) {
      console.error('Failed to save line:', error);
      toast({
        title: "Error",
        description: "Failed to save line changes",
        variant: "destructive",
      });
    }
  }, [fullLedger, fdaId, exchangeRate, onLedgerUpdate, toast]);

  // Debounced save for date picker
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  
  const debouncedSave = useCallback((lineId: string, field: string, value: any) => {
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

  const handleCellEdit = (lineId: string, field: string, value: any) => {
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
              type="number"
              value={line.amount_usd || ''}
              onChange={(e) => handleCellEdit(line.id, 'amount_usd', e.target.value)}
              className="h-8"
              placeholder="0.00"
            />

            {/* Amount BRL (read-only) */}
            <div className="h-8 px-2 bg-gray-50 border rounded text-right leading-8 text-gray-600">
              {fmtBRL(line.amount_local || 0)}
            </div>

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
                onCheckedChange={(checked) => handleCellEdit(line.id, 'paid', checked)}
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Ledger Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Legenda: AP = A pagar (fornecedores) · AR = A receber (cliente)
          </p>
        </div>
        <Button onClick={handleAddLine} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Line
        </Button>
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
      </CardContent>
    </Card>
  );
};