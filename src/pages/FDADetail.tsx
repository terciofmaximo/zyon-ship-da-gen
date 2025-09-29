import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FDALedgerTable } from "@/components/fda/FDALedgerTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Edit, X, Save, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFDA } from "@/hooks/useFDA";
import { useToast } from "@/hooks/use-toast";
import { FDAWithLedger, FDATotals } from "@/types/fda";
import { supabase } from "@/integrations/supabase/client";

const statusVariants = {
  Draft: "secondary",
  Posted: "default", 
  Closed: "outline",
} as const;

export default function FDADetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getFDA, updateFDAStatus, calculateFDATotals, loading } = useFDA();
  const [fda, setFda] = useState<FDAWithLedger | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [confirmPost, setConfirmPost] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastSavedBy, setLastSavedBy] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    vessel_name: "",
    imo: "",
    port: "",
    terminal: "",
    client_name: "",
    client_id: "",
    exchange_rate: "",
    fx_source: "",
    client_share_pct: 0,
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

  // Keyboard shortcut for Save draft (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && fda?.status === "Draft") {
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
        editForm.client_share_pct !== ((fda.meta as any)?.client_share_pct || 0);
      
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
          exchange_rate: fdaData.exchange_rate?.toString() || "",
          fx_source: (fdaData.meta as any)?.fx_source || "",
          client_share_pct: (fdaData.meta as any)?.client_share_pct || 0,
        });
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

  const handleSaveDraft = async () => {
    if (!fda || !id || isSaving) return;

    setIsSaving(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
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
          meta: {
            ...(fda.meta as any || {}),
            fx_source: editForm.fx_source,
            client_share_pct: editForm.client_share_pct,
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


  const handleCancel = () => {
    if (fda) {
      setEditForm({
        vessel_name: fda.vessel_name || "",
        imo: fda.imo || "",
        port: fda.port || "",
        terminal: fda.terminal || "",
        client_name: fda.client_name || "",
        client_id: fda.client_id || "",
        exchange_rate: fda.exchange_rate?.toString() || "",
        fx_source: (fda.meta as any)?.fx_source || "",
        client_share_pct: (fda.meta as any)?.client_share_pct || 0,
      });
    }
    setIsEditing(false);
  };


  const handlePost = async () => {
    if (!id) return;
    
    const success = await updateFDAStatus(id, "Posted");
    if (success) {
      setFda(prev => prev ? { ...prev, status: "Posted" } : null);
    }
    setConfirmPost(false);
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

  const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
  const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);

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

  const clientSharePct = (fda.meta as any)?.client_share_pct || 0;
  const dueFromClientUSD = totals.totalAP_USD * (clientSharePct / 100);
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
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveDraft} disabled={isSaving || !isDirty}>
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
                    <div className="text-sm mt-1">{fda.exchange_rate || "—"}</div>
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
              <div className="mt-4 space-y-2">
                <Label htmlFor="client_share_pct" className="text-xs">Client share (%) of Total Payables</Label>
                <Input
                  id="client_share_pct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editForm.client_share_pct}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setEditForm({ ...editForm, client_share_pct: val });
                  }}
                  onBlur={async () => {
                    if (!id) return;
                    await supabase
                      .from("fda")
                      .update({
                        meta: {
                          ...(fda.meta as any || {}),
                          client_share_pct: editForm.client_share_pct,
                        }
                      })
                      .eq("id", id);
                    await fetchFDA();
                  }}
                  className="h-8 text-center"
                />
                <p className="text-xs text-muted-foreground">Calculated from Total Payables (AP)</p>
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
                  onClick={handleSaveDraft}
                  disabled={isSaving || !isDirty}
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
                  disabled={loading || isDirty}
                  variant="secondary"
                  size="lg"
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Post FDA
                </Button>
              </>
            )}
            {isDirty && (
              <p className="text-sm text-muted-foreground flex items-center">
                You have unsaved changes. Press Ctrl/Cmd + S to save.
              </p>
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
    </div>
  );
}