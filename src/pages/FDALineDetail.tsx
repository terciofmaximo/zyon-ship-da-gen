import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useOrg } from '@/context/OrgProvider';

const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);

interface LedgerLine {
  id: string;
  fda_id: string;
  line_no: number;
  side: 'AP' | 'AR';
  category?: string;
  description?: string;
  counterparty?: string;
  amount_usd?: number;
  amount_local?: number;
  invoice_no?: string;
  invoice_date?: string;
  due_date?: string;
  payment_terms?: string;
  client_po?: string;
  notes?: string;
  status: 'Open' | 'Settled' | 'Partially Settled';
  assigned_to?: string;
  use_custom_fx?: boolean;
  custom_fx_rate?: number;
  fx_source_url?: string;
  details?: any;
  voyage_fixture?: string;
  cost_center?: string;
  gl_account?: string;
  billing_class?: string;
  markup_pct?: number;
  is_billable?: boolean;
  settled_at?: string;
  tenant_id: string;
}

interface Payment {
  id: string;
  paid_at: string;
  amount_usd: number;
  amount_local: number;
  fx_at_payment: number;
  method: string;
  reference?: string;
  receipt_url?: string;
}

interface Attachment {
  id: string;
  type: string;
  url: string;
  uploaded_at: string;
  version: number;
}

export default function FDALineDetail() {
  const { fdaId, lineId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeOrg } = useOrg();
  
  const [line, setLine] = useState<LedgerLine | null>(null);
  const [fdaExchangeRate, setFdaExchangeRate] = useState<number>(1);
  const [fdaData, setFdaData] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New payment form
  const [newPayment, setNewPayment] = useState({
    paid_at: '',
    amount_usd: '',
    fx_at_payment: '',
    method: 'Wire',
    reference: ''
  });

  useEffect(() => {
    loadData();
  }, [lineId, fdaId]);

  const loadData = async () => {
    if (!lineId || !fdaId) return;
    
    try {
      setLoading(true);
      
      // Load ledger line
      const { data: lineData, error: lineError } = await supabase
        .from('fda_ledger')
        .select('*')
        .eq('id', lineId)
        .single();
      
      if (lineError) throw lineError;
      setLine(lineData);
      
      // Load FDA header for exchange rate and other data
      const { data: fdaHeaderData, error: fdaError } = await supabase
        .from('fda')
        .select('*')
        .eq('id', fdaId)
        .single();
      
      if (fdaError) throw fdaError;
      setFdaData(fdaHeaderData);
      setFdaExchangeRate(fdaHeaderData.exchange_rate || 1);
      
      // Auto-fill line details from FDA if not already set
      if (lineData) {
        const currentDetails = (lineData.details as any) || {};
        if (!currentDetails.port) {
          const autoDetails = {
            ...currentDetails,
            port: currentDetails.port || fdaHeaderData.port || '',
            terminal: currentDetails.terminal || fdaHeaderData.terminal || '',
            vessel_name: currentDetails.vessel_name || fdaHeaderData.vessel_name || '',
            imo: currentDetails.imo || fdaHeaderData.imo || '',
          };
          lineData.details = autoDetails;
        }
        
        // Auto-fill client_po from FDA client_name if not set
        if (!lineData.client_po && fdaHeaderData.client_name) {
          lineData.client_po = fdaHeaderData.client_name;
        }
      }
      
      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('fda_ledger_payments')
        .select('*')
        .eq('ledger_id', lineId)
        .order('paid_at', { ascending: false });
      
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
      
      // Load attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('fda_ledger_attachments')
        .select('*')
        .eq('ledger_id', lineId)
        .order('uploaded_at', { ascending: false });
      
      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveField = async (field: string, value: any) => {
    if (!line) return;
    
    try {
      const updates: any = { [field]: value };
      
      // Recalculate BRL if USD or FX changed
      if (field === 'amount_usd' || field === 'custom_fx_rate' || field === 'use_custom_fx') {
        const usd = field === 'amount_usd' ? parseFloat(value) : (line.amount_usd || 0);
        const fx = line.use_custom_fx 
          ? (field === 'custom_fx_rate' ? parseFloat(value) : (line.custom_fx_rate || fdaExchangeRate))
          : fdaExchangeRate;
        updates.amount_local = usd * fx;
      }
      
      const { error } = await supabase
        .from('fda_ledger')
        .update(updates)
        .eq('id', line.id);
      
      if (error) throw error;
      
      setLine({ ...line, ...updates });
      
      toast({
        title: "Saved",
        description: "Changes saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addPayment = async () => {
    if (!line || !newPayment.paid_at || !newPayment.amount_usd || !newPayment.fx_at_payment) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }
    
    const tenantId = line.tenant_id || fdaData?.tenant_id;
    
    if (!tenantId) {
      toast({
        title: "Error",
        description: "Cannot determine organization for this payment",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const usd = parseFloat(newPayment.amount_usd);
      const fx = parseFloat(newPayment.fx_at_payment);
      
      const { data, error } = await supabase
        .from('fda_ledger_payments')
        .insert({
          ledger_id: line.id,
          paid_at: newPayment.paid_at,
          amount_usd: usd,
          amount_local: usd * fx,
          fx_at_payment: fx,
          method: newPayment.method,
          reference: newPayment.reference || null,
          tenant_id: tenantId,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setPayments([data, ...payments]);
      setNewPayment({
        paid_at: '',
        amount_usd: '',
        fx_at_payment: '',
        method: 'Wire',
        reference: ''
      });
      
      // Check if fully settled
      const totalPaid = [...payments, data].reduce((sum, p) => sum + p.amount_usd, 0);
      if (totalPaid >= (line.amount_usd || 0)) {
        await saveField('status', 'Settled');
      } else {
        await saveField('status', 'Partially Settled');
      }
      
      toast({
        title: "Success",
        description: "Payment added",
      });
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('fda_ledger_payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
      
      const updatedPayments = payments.filter(p => p.id !== paymentId);
      setPayments(updatedPayments);
      
      // Update status
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount_usd, 0);
      if (totalPaid === 0) {
        await saveField('status', 'Open');
      } else if (totalPaid < (line?.amount_usd || 0)) {
        await saveField('status', 'Partially Settled');
      }
      
      toast({
        title: "Success",
        description: "Payment removed",
      });
    } catch (error: any) {
      console.error('Error removing payment:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markAsSettled = async () => {
    await saveField('status', 'Settled');
    await saveField('settled_at', new Date().toISOString());
  };

  const undoSettlement = async () => {
    await saveField('status', 'Open');
    await saveField('settled_at', null);
  };

  if (loading || !line) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading...</div>
      </div>
    );
  }

  const effectiveFx = line.use_custom_fx ? (line.custom_fx_rate || fdaExchangeRate) : fdaExchangeRate;
  const computedBRL = (line.amount_usd || 0) * effectiveFx;
  const totalPaidUSD = payments.reduce((sum, p) => sum + p.amount_usd, 0);
  const markupAmount = (line.amount_usd || 0) * (line.markup_pct || 0) / 100;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/fda/${fdaId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to FDA
        </Button>
        <h1 className="text-2xl font-bold">Line {line.line_no} Details</h1>
      </div>

      {/* A) Header Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-start">
            <Badge variant={line.side === 'AP' ? 'destructive' : 'default'}>
              {line.side}
            </Badge>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Category</div>
              <div className="font-medium">{line.category || 'N/A'}</div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Description</div>
              <Input
                value={line.description || ''}
                onChange={(e) => saveField('description', e.target.value)}
              />
            </div>
          </div>
          
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold">{fmtUSD(line.amount_usd || 0)}</div>
              <div className="text-sm text-muted-foreground">Amount (USD)</div>
            </div>
            <div>
              <div className="text-2xl text-muted-foreground">{fmtBRL(line.amount_local || 0)}</div>
              <div className="text-sm text-muted-foreground">Amount (BRL)</div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={line.status} onValueChange={(v) => saveField('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Partially Settled">Partially Settled</SelectItem>
                  <SelectItem value="Settled">Settled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B) Invoicing */}
      <Card>
        <CardHeader>
          <CardTitle>Invoicing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Invoice #</Label>
              <Input
                value={line.invoice_no || ''}
                onChange={(e) => saveField('invoice_no', e.target.value)}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {line.due_date ? format(new Date(line.due_date), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={line.due_date ? new Date(line.due_date) : undefined}
                    onSelect={(date) => saveField('due_date', date?.toISOString().split('T')[0])}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div>
            <Label>Client PO / Reference</Label>
            <Input
              value={line.client_po || ''}
              onChange={(e) => saveField('client_po', e.target.value)}
              placeholder={fdaData?.client_name || 'Client reference'}
            />
          </div>
          
          <div>
            <Label>Notes</Label>
            <Textarea
              value={line.notes || ''}
              onChange={(e) => saveField('notes', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* C) Payments & Settlement */}
      <Card>
        <CardHeader>
          <CardTitle>Payments & Settlement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Add Partial Payment</div>
            <div className="grid grid-cols-5 gap-2">
              <Input
                type="date"
                value={newPayment.paid_at}
                onChange={(e) => setNewPayment({ ...newPayment, paid_at: e.target.value })}
                placeholder="Date"
              />
              <Input
                type="number"
                value={newPayment.amount_usd}
                onChange={(e) => setNewPayment({ ...newPayment, amount_usd: e.target.value })}
                placeholder="Amount (USD)"
              />
              <Input
                type="number"
                value={newPayment.fx_at_payment}
                onChange={(e) => setNewPayment({ ...newPayment, fx_at_payment: e.target.value })}
                placeholder="FX Rate"
              />
              <Select
                value={newPayment.method}
                onValueChange={(v) => setNewPayment({ ...newPayment, method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wire">Wire</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Swift">Swift</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addPayment}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Input
              className="mt-2"
              value={newPayment.reference}
              onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
              placeholder="Reference / Transaction ID"
            />
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Payment History</div>
            {payments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No payments recorded</div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex gap-4 text-sm">
                    <span>{format(new Date(payment.paid_at), 'PP')}</span>
                    <span className="font-medium">{fmtUSD(payment.amount_usd)}</span>
                    <span className="text-muted-foreground">{fmtBRL(payment.amount_local)}</span>
                    <span className="text-muted-foreground">FX: {payment.fx_at_payment}</span>
                    <span>{payment.method}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removePayment(payment.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
          
          <Separator />
          
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Total Paid</div>
              <div className="text-lg font-medium">{fmtUSD(totalPaidUSD)}</div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Remaining</div>
              <div className="text-lg font-medium">{fmtUSD((line.amount_usd || 0) - totalPaidUSD)}</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={markAsSettled} disabled={line.status === 'Settled'}>
              Mark as Settled
            </Button>
            <Button variant="outline" onClick={undoSettlement} disabled={line.status === 'Open'}>
              Undo Settlement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* D) Operational Context */}
      <Card>
        <CardHeader>
          <CardTitle>Operational Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Port</Label>
              <Input
                value={line.details?.port || ''}
                onChange={(e) => saveField('details', { ...line.details, port: e.target.value })}
              />
            </div>
            <div>
              <Label>Terminal</Label>
              <Input
                value={line.details?.terminal || ''}
                onChange={(e) => saveField('details', { ...line.details, terminal: e.target.value })}
              />
            </div>
            <div>
              <Label>Berth</Label>
              <Input
                value={line.details?.berth || ''}
                onChange={(e) => saveField('details', { ...line.details, berth: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vessel Name</Label>
              <Input
                value={line.details?.vessel_name || ''}
                onChange={(e) => saveField('details', { ...line.details, vessel_name: e.target.value })}
              />
            </div>
            <div>
              <Label>IMO</Label>
              <Input
                value={line.details?.imo || ''}
                onChange={(e) => saveField('details', { ...line.details, imo: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>DWT Bracket</Label>
              <Input
                value={line.details?.dwt_bracket || ''}
                onChange={(e) => saveField('details', { ...line.details, dwt_bracket: e.target.value })}
              />
            </div>
            <div>
              <Label>Pilotage Group</Label>
              <Input
                value={line.details?.pilotage_group || ''}
                onChange={(e) => saveField('details', { ...line.details, pilotage_group: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* E) Allocation & Accounting */}
      <Card>
        <CardHeader>
          <CardTitle>Allocation & Accounting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Voyage / Fixture / Job</Label>
              <Input
                value={line.voyage_fixture || ''}
                onChange={(e) => saveField('voyage_fixture', e.target.value)}
              />
            </div>
            <div>
              <Label>Cost Center / Project / WBS</Label>
              <Input
                value={line.cost_center || ''}
                onChange={(e) => saveField('cost_center', e.target.value)}
              />
            </div>
            <div>
              <Label>GL Account</Label>
              <Input
                value={line.gl_account || ''}
                onChange={(e) => saveField('gl_account', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Billing Class</Label>
              <Select
                value={line.billing_class || ''}
                onValueChange={(v) => saveField('billing_class', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pass-through">Pass-through</SelectItem>
                  <SelectItem value="Markup">Markup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Markup %</Label>
              <Input
                type="number"
                value={line.markup_pct || ''}
                onChange={(e) => saveField('markup_pct', parseFloat(e.target.value))}
                disabled={line.billing_class !== 'Markup'}
              />
            </div>
          </div>
          
          {line.billing_class === 'Markup' && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Computed Markup Amount</div>
              <div className="text-lg font-medium">{fmtUSD(markupAmount)}</div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Switch
              checked={line.is_billable !== false}
              onCheckedChange={(checked) => saveField('is_billable', checked)}
            />
            <Label>Billable?</Label>
          </div>
        </CardContent>
      </Card>

      {/* F) Attachments */}
      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Attachment
          </Button>
          
          <div className="space-y-2">
            {attachments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No attachments</div>
            ) : (
              attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex gap-4 text-sm">
                    <span className="font-medium">{att.type}</span>
                    <span className="text-muted-foreground">v{att.version}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(att.uploaded_at), 'PP')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={att.url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* G) Comments & Audit */}
      <Card>
        <CardHeader>
          <CardTitle>Comments & Audit Trail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Add a comment (use @mentions)..."
              rows={3}
            />
            <Button className="mt-2">Post Comment</Button>
          </div>
          
          <Separator />
          
          <div>
            <div className="text-sm font-medium mb-2">Audit Log</div>
            <div className="text-sm text-muted-foreground">
              Audit trail functionality will track changes to amounts, FX, invoices, dates, attachments, and status.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
