/*
 * @ai-context
 * Role: FDA detail/edit page - comprehensive view and editing of FDA header, ledger, and financial summary.
 * DoD:
 * - Preserve concurrency checks (updated_at timestamp validation).
 * - Save draft functionality must remain always enabled (no validation blocking).
 * - Maintain exchange rate recalculation logic when FX changes.
 * - Keep audit trail (last saved by/at display).
 * Constraints:
 * - If adding fields, ensure they're saved in handleSaveDraft().
 * - Do not disable "Save Draft" button with validation logic.
 * - Preserve unsaved changes warning (isDirty state).
 * - Maintain keyboard shortcut (Ctrl/Cmd + S).
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FDALedgerTable } from "@/components/fda/FDALedgerTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Edit, X, Save, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFDA } from "@/hooks/useFDA";
import { useToast } from "@/hooks/use-toast";
import { FDAWithLedger, FDATotals } from "@/types/fda";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/utils";

const statusVariants = {
  Draft: "secondary",
  Posted: "default", 
  Closed: "outline",
} as const;

export default function FDADetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getFDA, updateFDAStatus, calculateFDATotals, resyncFromPda, loading } = useFDA();
  const [fda, setFda] = useState<FDAWithLedger | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [confirmPost, setConfirmPost] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastSavedBy, setLastSavedBy] = useState<string | null>(null);
  const [tempClientPaid, setTempClientPaid] = useState<string>("");
  const [editForm, setEditForm] = useState({
    vessel_name: "",
    imo: "",
    port: "",
    terminal: "",
    client_name: "",
    client_id: "",
    exchange_rate: "",
    fx_source: "",
    received_from_client_usd: 0,
    eta: null as Date | null,
    etb: null as Date | null,
    ets: null as Date | null,
  });

  // Warn on browser close/refresh when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (id) {
      fetchFDA();
    }
  }, [id]);

  // Keyboard shortcut for Save (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && (fda?.status === "Draft" || fda?.status === "Posted")) {
          handleSaveDraft();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, fda?.status]);

  // Mark as dirty when form changes
  useEffect(() => {
    if (fda) {
      const hasChanges = 
        editForm.vessel_name !== (fda.vessel_name || "") ||
        editForm.imo !== (fda.imo || "") ||
        editForm.port !== (fda.port || "") ||
        editForm.terminal !== (fda.terminal || "") ||
        editForm.client_name !== (fda.client_name || "") ||
        editForm.client_id !== (fda.client_id || "") ||
        editForm.exchange_rate !== (fda.exchange_rate?.toString() || "") ||
        editForm.fx_source !== ((fda.meta as any)?.fx_source || "") ||
        editForm.received_from_client_usd !== ((fda.meta as any)?.received_from_client_usd || 0) ||
        (editForm.eta?.toISOString() || null) !== (fda.eta || null) ||
        (editForm.etb?.toISOString() || null) !== (fda.etb || null) ||
        (editForm.ets?.toISOString() || null) !== (fda.ets || null);
      
      setIsDirty(hasChanges);
    }
  }, [editForm, fda]);

  const fetchFDA = async () => {
    if (!id) return;
    
    setLoadingPage(true);
    try {
      const fdaData = await getFDA(id);
      if (fdaData) {
        setFda(fdaData);
        setEditForm({
          vessel_name: fdaData.vessel_name || "",
          imo: fdaData.imo || "",
          port: fdaData.port || "",
          terminal: fdaData.terminal || "",
          client_name: fdaData.client_name || "",
          client_id: fdaData.client_id || "",
          exchange_rate: fdaData.exchange_rate?.toFixed(4) || "",
          fx_source: (fdaData.meta as any)?.fx_source || "",
          received_from_client_usd: (fdaData.meta as any)?.received_from_client_usd || 0,
          eta: fdaData.eta ? new Date(fdaData.eta) : null,
          etb: fdaData.etb ? new Date(fdaData.etb) : null,
          ets: fdaData.ets ? new Date(fdaData.ets) : null,
        });
        setTempClientPaid(((fdaData.meta as any)?.received_from_client_usd || 0).toString());
        setIsDirty(false);
        setLastSavedAt(fdaData.updated_at);
      } else {
        navigate("/fda");
      }
    } catch (error) {
      console.error("Error fetching FDA:", error);
      navigate("/fda");
    } finally {
      setLoadingPage(false);
    }
  };

  // @ai-editable:start(handleSaveDraft)
  const handleSaveDraft = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!fda || !id || isSaving) return;

    setIsSaving(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // @ai-guard:start - concurrency check
      // Check for concurrent updates
      const { data: currentFda, error: checkError } = await supabase
        .from("fda")
        .select("updated_at")
        .eq("id", id)
        .single();

      if (checkError) throw checkError;

      if (currentFda.updated_at !== fda.updated_at) {
        toast({
          title: "Concurrency Conflict",
          description: "This FDA was updated in another tab. Please refresh.",
          variant: "destructive",
          action: (
            <Button size="sm" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          ),
        });
        return;
      }
      // @ai-guard:end

      // Update FDA header
      const { error } = await supabase
        .from("fda")
        .update({
          vessel_name: editForm.vessel_name,
          imo: editForm.imo,
          port: editForm.port,
          terminal: editForm.terminal,
          client_name: editForm.client_name,
          client_id: editForm.client_id,
          exchange_rate: parseFloat(editForm.exchange_rate) || 0,
          fx_source: editForm.fx_source,
          eta: editForm.eta?.toISOString() || null,
          etb: editForm.etb?.toISOString() || null,
          ets: editForm.ets?.toISOString() || null,
          meta: {
            ...(fda.meta as any || {}),
            fx_source: editForm.fx_source,
            received_from_client_usd: editForm.received_from_client_usd,
          }
        })
        .eq("id", id);

      if (error) throw error;

      // Recalculate BRL amounts if exchange rate changed
      if (fda.exchange_rate !== parseFloat(editForm.exchange_rate)) {
        const newRate = parseFloat(editForm.exchange_rate) || 0;
        const updates = fda.ledger.map(entry => ({
          id: entry.id,
          amount_local: (entry.amount_usd || 0) * newRate,
        }));

        for (const update of updates) {
          await supabase
            .from("fda_ledger")
            .update({ amount_local: update.amount_local })
            .eq("id", update.id);
        }
      }

      toast({
        title: "Draft saved",
        description: "All changes have been saved successfully.",
      });

      setLastSavedAt(new Date().toISOString());
      setLastSavedBy(user?.email || null);
      setIsDirty(false);
      await fetchFDA();
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  // @ai-editable:end


  const handleCancel = () => {
    if (fda) {
      setEditForm({
        vessel_name: fda.vessel_name || "",
        imo: fda.imo || "",
        port: fda.port || "",
        terminal: fda.terminal || "",
        client_name: fda.client_name || "",
        client_id: fda.client_id || "",
        exchange_rate: fda.exchange_rate?.toFixed(4) || "",
        fx_source: (fda.meta as any)?.fx_source || "",
        received_from_client_usd: (fda.meta as any)?.received_from_client_usd || 0,
        eta: fda.eta ? new Date(fda.eta) : null,
        etb: fda.etb ? new Date(fda.etb) : null,
        ets: fda.ets ? new Date(fda.ets) : null,
      });
    }
    setIsEditing(false);
  };


  const handleResync = async () => {
    if (!id) return;
    
    const success = await resyncFromPda(id);
    if (success) {
      await fetchFDA(); // Reload FDA data to show new lines
    }
  };

  const handlePost = async () => {
    if (!id) return;
    
    // Auto-save pending changes before posting
    if (isDirty) {
      await handleSaveDraft();
    }
    
    const success = await updateFDAStatus(id, "Posted");
    if (success) {
      setFda(prev => prev ? { ...prev, status: "Posted" } : null);
      setIsDirty(false);
    }
    setConfirmPost(false);
  };

  const handleClose = async () => {
    if (!id) return;
    
    // Auto-save pending changes before closing
    if (isDirty) {
      await handleSaveDraft();
    }
    
    const success = await updateFDAStatus(id, "Closed");
    if (success) {
      setFda(prev => prev ? { ...prev, status: "Closed" } : null);
      setIsDirty(false);
    }
    setConfirmClose(false);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fmtUSD = (n: number) => formatCurrency(n, 'USD');
  const fmtBRL = (n: number) => formatCurrency(n, 'BRL');

  if (loadingPage) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading FDA...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!fda) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">FDA not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totals = calculateFDATotals(fda.ledger);

  const receivedFromClientUSD = (fda.meta as any)?.received_from_client_usd || 0;
  const dueFromClientUSD = Math.max(0, totals.net_USD - receivedFromClientUSD);
  const dueFromClientBRL = dueFromClientUSD * (parseFloat(fda.exchange_rate?.toString() || "0") || 0);

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate("/fda")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to FDA List
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FDA {fda.id.slice(-8)}</h1>
          <p className="text-muted-foreground text-lg">{fda.vessel_name || "—"} | {fda.port || "—"}</p>
        </div>
        <Badge variant={statusVariants[fda.status]}>
          {fda.status}
        </Badge>
      </div>

      {/* Header Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>FDA Information</CardTitle>
          {!isEditing ? (
            <div className="flex gap-2">
              {fda.status === "Draft" && (
                <Button variant="outline" size="sm" onClick={handleResync} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Resync from PDA
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveDraft}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Vessel Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Vessel Details</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="vessel_name">Vessel Name</Label>
                  {isEditing ? (
                    <Input
                      id="vessel_name"
                      value={editForm.vessel_name}
                      onChange={(e) => setEditForm({ ...editForm, vessel_name: e.target.value })}
                      placeholder="Enter vessel name"
                    />
                  ) : (
                    <div className="text-sm mt-1">{fda.vessel_name || "—"}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="imo">IMO</Label>
                  {isEditing ? (
                    <Input
                      id="imo"
                      value={editForm.imo}
                      onChange={(e) => setEditForm({ ...editForm, imo: e.target.value })}
                      placeholder="Enter IMO"
                    />
                  ) : (
                    <div className="text-sm mt-1">{fda.imo || "—"}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="port">Port</Label>
                  {isEditing ? (
                    <Input
                      id="port"
                      value={editForm.port}
                      onChange={(e) => setEditForm({ ...editForm, port: e.target.value })}
                      placeholder="Enter port"
                    />
                  ) : (
                    <div className="text-sm mt-1">{fda.port || "—"}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="terminal">Terminal</Label>
                  {isEditing ? (
                    <Input
                      id="terminal"
                      value={editForm.terminal}
                      onChange={(e) => setEditForm({ ...editForm, terminal: e.target.value })}
                      placeholder="Enter terminal"
                    />
                  ) : (
                    <div className="text-sm mt-1">{fda.terminal || "—"}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Client Information</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="client_name">Client</Label>
                  {isEditing ? (
                    <Input
                      id="client_name"
                      value={editForm.client_name}
                      onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                      placeholder="Enter client name"
                    />
                  ) : (
                    <div className="text-sm mt-1">{fda.client_name || "—"}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="client_id">Client ID</Label>
                  {isEditing ? (
                    <Input
                      id="client_id"
                      value={editForm.client_id}
                      onChange={(e) => setEditForm({ ...editForm, client_id: e.target.value })}
                      placeholder="Enter client ID"
                    />
                  ) : (
                    <div className="text-sm mt-1">{fda.client_id || "—"}</div>
                  )}
                </div>
                <div>
                  <Label>PDA ID</Label>
                  <div className="text-sm mt-1">
                    {fda.pda_id ? (
                      <Link to={`/pda/${fda.pda_id}/review`} className="text-primary hover:underline">
                        {fda.pda_id.slice(-8)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div>
                  <Label>Created By</Label>
                  <div className="text-sm mt-1">{fda.created_by || "—"}</div>
                </div>
                <div>
                  <Label>Created On</Label>
                  <div className="text-sm mt-1">{formatDate(fda.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Currency / FX */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Currency / FX</h4>
              <div className="space-y-3">
                <div>
                  <Label>Base</Label>
                  <div className="text-sm mt-1">{fda.currency_base}</div>
                </div>
                <div>
                  <Label>Local</Label>
                  <div className="text-sm mt-1">{fda.currency_local}</div>
                </div>
                 <div>
                   <Label htmlFor="exchange_rate">Exchange Rate (USD/BRL)</Label>
                   {isEditing ? (
                     <Input
                       id="exchange_rate"
                       type="number"
                       step="0.0001"
                       value={editForm.exchange_rate}
                       onChange={(e) => setEditForm({ ...editForm, exchange_rate: e.target.value })}
                       placeholder="Enter exchange rate"
                     />
                   ) : (
                     <div className="text-sm mt-1">
                       {fda.exchange_rate ? formatNumber(parseFloat(fda.exchange_rate.toString()), 4) : "—"}
                     </div>
                   )}
                 </div>
                <div>
                  <Label htmlFor="fx_source">FX Source</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        id="fx_source"
                        value={editForm.fx_source}
                        onChange={(e) => setEditForm({ ...editForm, fx_source: e.target.value })}
                        placeholder="e.g., BCB PTAX (D-1)"
                      />
                      <Button variant="outline" size="sm" className="w-full">
                        Fetch Latest
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm mt-1">{(fda.meta as any)?.fx_source || "—"}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Vessel Schedule */}
            <div className="space-y-4 md:col-span-3 border-t pt-4 mt-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Vessel Schedule</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="eta">ETA (Estimated Time of Arrival)</Label>
                  {isEditing ? (
                    <Input
                      id="eta"
                      type="datetime-local"
                      value={editForm.eta ? format(editForm.eta, "yyyy-MM-dd'T'HH:mm") : ""}
                      onChange={(e) => setEditForm({ ...editForm, eta: e.target.value ? new Date(e.target.value) : null })}
                    />
                  ) : (
                    <div className="text-sm mt-1">
                      {fda.eta ? format(new Date(fda.eta), "MMM dd, yyyy HH:mm") : "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="etb">ETB (Estimated Time of Berthing)</Label>
                  {isEditing ? (
                    <Input
                      id="etb"
                      type="datetime-local"
                      value={editForm.etb ? format(editForm.etb, "yyyy-MM-dd'T'HH:mm") : ""}
                      onChange={(e) => setEditForm({ ...editForm, etb: e.target.value ? new Date(e.target.value) : null })}
                    />
                  ) : (
                    <div className="text-sm mt-1">
                      {fda.etb ? format(new Date(fda.etb), "MMM dd, yyyy HH:mm") : "—"}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="ets">ETS (Estimated Time of Sailing)</Label>
                  {isEditing ? (
                    <Input
                      id="ets"
                      type="datetime-local"
                      value={editForm.ets ? format(editForm.ets, "yyyy-MM-dd'T'HH:mm") : ""}
                      onChange={(e) => setEditForm({ ...editForm, ets: e.target.value ? new Date(e.target.value) : null })}
                    />
                  ) : (
                    <div className="text-sm mt-1">
                      {fda.ets ? format(new Date(fda.ets), "MMM dd, yyyy HH:mm") : "—"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-destructive/10 rounded-lg border border-destructive/20">
              <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase">USD</h4>
              <div className="text-3xl font-bold text-destructive mb-2">{fmtUSD(totals.totalAP_USD)}</div>
              <div className="text-sm text-muted-foreground">{fmtBRL(totals.totalAP_BRL)}</div>
              <div className="text-xs font-semibold text-destructive mt-3">Total Payables (AP)</div>
            </div>
            <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
              <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase">USD</h4>
              <div className="text-3xl font-bold text-primary mb-2">{fmtUSD(totals.totalAR_USD)}</div>
              <div className="text-sm text-muted-foreground">{fmtBRL(totals.totalAR_BRL)}</div>
              <div className="text-xs font-semibold text-primary mt-3">Total Receivables (AR)</div>
            </div>
            <div className="text-center p-6 bg-accent rounded-lg border">
              <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase">USD</h4>
              <div className="text-3xl font-bold mb-2">{fmtUSD(dueFromClientUSD)}</div>
              <div className="text-sm text-muted-foreground">{fmtBRL(dueFromClientBRL)}</div>
              <div className="text-xs font-semibold mt-3">Due from Client</div>
              {receivedFromClientUSD > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Considerando {fmtUSD(receivedFromClientUSD)} já recebidos
                </div>
              )}
              <div className="mt-4 space-y-2">
                <Label htmlFor="client_paid_usd" className="text-xs">Pago pelo Cliente (USD)</Label>
                <div className="flex gap-2">
                  <Input
                    id="client_paid_usd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={tempClientPaid}
                    onChange={(e) => setTempClientPaid(e.target.value)}
                    className="h-8 text-center"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const val = parseFloat(tempClientPaid) || 0;
                      setEditForm({ ...editForm, received_from_client_usd: val });
                      setIsDirty(true);
                      toast({
                        title: "Value Updated",
                        description: "Click 'Save Draft' to persist changes.",
                      });
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Details - Fully Editable Table */}
      <FDALedgerTable
        fdaId={id!}
        ledger={fda.ledger}
        exchangeRate={parseFloat(editForm.exchange_rate) || 1}
        onLedgerUpdate={(updatedLedger) => {
          setFda({ ...fda, ledger: updatedLedger });
        }}
      />

      {/* Remarks Field */}
      <Card>
        <CardHeader>
          <CardTitle>Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md resize-y"
            placeholder="Add remarks here..."
            value={fda.remarks || ""}
            onChange={(e) => {
              setFda({ ...fda, remarks: e.target.value });
              setIsDirty(true);
            }}
            onBlur={async () => {
              if (!id) return;
              try {
                await supabase
                  .from("fda")
                  .update({ remarks: fda.remarks })
                  .eq("id", id);
              } catch (error) {
                console.error("Error saving remarks:", error);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Actions Bar - Sticky at bottom */}
      <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t pt-4 pb-6">
        <div className="flex flex-col gap-4">
          {lastSavedAt && (
            <p className="text-sm text-muted-foreground">
              Last saved at {new Date(lastSavedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {lastSavedBy && ` by ${lastSavedBy}`}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {fda.status === "Draft" && (
              <>
                <Button 
                  type="button"
                  onClick={(e) => handleSaveDraft(e)}
                  size="lg"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSaving ? "Saving..." : "Save draft"}
                </Button>
                <Button 
                  onClick={() => setConfirmPost(true)}
                  disabled={loading}
                  variant="secondary"
                  size="lg"
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Post FDA
                </Button>
              </>
            )}
            {fda.status === "Posted" && (
              <>
                <Button 
                  type="button"
                  onClick={(e) => handleSaveDraft(e)}
                  size="lg"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button 
                  onClick={() => setConfirmClose(true)}
                  disabled={loading}
                  variant="secondary"
                  size="lg"
                  className="bg-muted hover:bg-muted/90"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Close FDA
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Post Confirmation Dialog */}
      <Dialog open={confirmPost} onOpenChange={setConfirmPost}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post FDA</DialogTitle>
            <DialogDescription>
              Posting the FDA will lock the structure. You'll only be able to edit invoice fields and line status after posting. 
              Are you sure you want to post this FDA?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPost(false)}>
              Cancel
            </Button>
            <Button onClick={handlePost} disabled={loading}>
              {loading ? "Posting..." : "Post FDA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close FDA</DialogTitle>
            <DialogDescription>
              Closing the FDA will finalize all transactions. No further edits will be allowed after closing.
              Are you sure you want to close this FDA?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleClose} disabled={loading}>
              {loading ? "Closing..." : "Close FDA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}