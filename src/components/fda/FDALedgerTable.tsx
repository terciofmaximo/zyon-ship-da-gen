import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FDALedger } from '@/types/fda';
import Decimal from 'decimal.js';

interface FDALedgerTableProps {
  fdaId: string;
  ledger: FDALedger[];
  exchangeRate: number;
  onLedgerUpdate: (updatedLedger: FDALedger[]) => void;
}

// Standard FDA categories from PDA rules
const STANDARD_CATEGORIES = [
  { name: 'Pilotage IN', side: 'AP' as const },
  { name: 'Pilotage OUT', side: 'AP' as const },
  { name: 'Towage IN', side: 'AP' as const },
  { name: 'Towage OUT', side: 'AP' as const },
  { name: 'Light dues', side: 'AP' as const },
  { name: 'Dockage', side: 'AP' as const },
  { name: 'Linesman', side: 'AP' as const },
  { name: 'Launch boat', side: 'AP' as const },
  { name: 'Immigration tax', side: 'AP' as const },
  { name: 'Free pratique tax', side: 'AP' as const },
  { name: 'Shipping association', side: 'AP' as const },
  { name: 'Clearance', side: 'AP' as const },
  { name: 'Paperless Port System', side: 'AP' as const },
  { name: 'Waterway channel (Table I)', side: 'AP' as const },
  { name: 'Agency fee', side: 'AR' as const },
];

const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open': return 'bg-yellow-100 text-yellow-800';
    case 'Partially Settled': return 'bg-blue-100 text-blue-800';
    case 'Settled': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const FDALedgerTable: React.FC<FDALedgerTableProps> = ({
  fdaId,
  ledger,
  exchangeRate,
  onLedgerUpdate
}) => {
  const [fullLedger, setFullLedger] = useState<FDALedger[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string>('line_no');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  // Initialize full ledger with standard categories
  useEffect(() => {
    const existingCategories = new Set(ledger.map(l => l.category));
    const missingCategories = STANDARD_CATEGORIES.filter(
      cat => !existingCategories.has(cat.name)
    );

    const standardLines: FDALedger[] = missingCategories.map((cat, index) => ({
      id: `standard-${index}`,
      fda_id: fdaId,
      line_no: ledger.length + index + 1,
      side: cat.side,
      category: cat.name,
      description: cat.name,
      counterparty: cat.side === 'AR' ? 'Client' : '',
      amount_usd: 0,
      amount_local: 0,
      invoice_no: null,
      due_date: null,
      status: 'Open',
      source: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setFullLedger([...ledger, ...standardLines]);
  }, [ledger, fdaId]);

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
      onLedgerUpdate(newFullLedger.filter(l => !l.id.startsWith('standard-') || l.amount_usd > 0));
      
    } catch (error) {
      console.error('Failed to save line:', error);
      toast({
        title: "Error",
        description: "Failed to save line changes",
        variant: "destructive",
      });
    }
  }, [fullLedger, fdaId, exchangeRate, onLedgerUpdate, toast]);

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
      {data.map((line) => (
        <div
          key={line.id}
          className={`grid grid-cols-10 gap-2 p-2 border rounded-md text-sm ${
            line.side === 'AP' 
              ? 'bg-red-50 border-red-100' 
              : 'bg-green-50 border-green-100'
          }`}
        >
          {/* Line # */}
          <div className="text-center font-mono text-gray-600">
            {line.line_no}
          </div>

          {/* Side */}
          <Select
            value={line.side}
            onValueChange={(value) => handleCellEdit(line.id, 'side', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AP">AP</SelectItem>
              <SelectItem value="AR">AR</SelectItem>
            </SelectContent>
          </Select>

          {/* Category */}
          <Input
            value={line.category || ''}
            onChange={(e) => handleCellEdit(line.id, 'category', e.target.value)}
            className="h-8"
            placeholder="Category"
          />

          {/* Description */}
          <Input
            value={line.description || ''}
            onChange={(e) => handleCellEdit(line.id, 'description', e.target.value)}
            className="h-8"
            placeholder="Description"
          />

          {/* Counterparty */}
          <Input
            value={line.counterparty || ''}
            onChange={(e) => handleCellEdit(line.id, 'counterparty', e.target.value)}
            className="h-8"
            placeholder="Counterparty"
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

          {/* Due Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 px-2 text-left font-normal">
                {line.due_date ? format(new Date(line.due_date), 'MM/dd/yyyy') : 'Select date'}
                <Calendar className="ml-1 h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={line.due_date ? new Date(line.due_date) : undefined}
                onSelect={(date) => 
                  handleCellEdit(line.id, 'due_date', date?.toISOString().split('T')[0] || null)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Status & Paid */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={line.status === 'Settled'}
              onCheckedChange={(checked) => handleCellEdit(line.id, 'paid', checked)}
            />
            <Badge className={getStatusColor(line.status)}>
              {line.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Ledger Details</CardTitle>
        <Dialog open={insertModalOpen} onOpenChange={setInsertModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Insert Line
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert New Ledger Line</DialogTitle>
            </DialogHeader>
            {/* Insert modal content would go here */}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Column Headers */}
        <div className="grid grid-cols-10 gap-2 p-2 mb-2 text-sm font-medium text-gray-700 bg-gray-50 rounded">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('line_no')}
            className="h-auto p-0 text-left justify-start"
          >
            Line # <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
          <div>Side</div>
          <div>Category</div>
          <div>Description</div>
          <div>Counterparty</div>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('status')}
            className="h-auto p-0 text-left justify-start"
          >
            Status <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ar">Receivables (AR)</TabsTrigger>
            <TabsTrigger value="ap">Payables (AP)</TabsTrigger>
          </TabsList>
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