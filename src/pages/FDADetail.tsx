import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Download, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFDA } from "@/hooks/useFDA";
import { useToast } from "@/hooks/use-toast";
import { FDAWithLedger, FDATotals } from "@/types/fda";

const statusVariants = {
  Draft: "secondary",
  Posted: "default", 
  Closed: "outline",
} as const;

export default function FDADetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getFDA, rebuildFromPda, updateFDAStatus, calculateFDATotals, loading } = useFDA();
  const [fda, setFda] = useState<FDAWithLedger | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [confirmRebuild, setConfirmRebuild] = useState(false);
  const [confirmPost, setConfirmPost] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFDA();
    }
  }, [id]);

  const fetchFDA = async () => {
    if (!id) return;
    
    setLoadingPage(true);
    try {
      const fdaData = await getFDA(id);
      if (fdaData) {
        setFda(fdaData);
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

  const handleRebuildFromPda = async () => {
    if (!id) return;
    
    const success = await rebuildFromPda(id);
    if (success) {
      await fetchFDA(); // Refresh data
    }
    setConfirmRebuild(false);
  };

  const handlePost = async () => {
    if (!id) return;
    
    const success = await updateFDAStatus(id, "Posted");
    if (success) {
      setFda(prev => prev ? { ...prev, status: "Posted" } : null);
    }
    setConfirmPost(false);
  };

  const handleGeneratePDF = () => {
    if (!fda) return;

    try {
      const totals = calculateFDATotals(fda.ledger);
      
      // Create a simple HTML document for FDA
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>FDA ${fda.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .totals { font-weight: bold; background-color: #f9f9f9; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Final Disbursement Account</h1>
              <h2>FDA ID: ${fda.id}</h2>
            </div>
            
            <div class="section">
              <h3>Vessel Information</h3>
              <p><strong>Vessel:</strong> ${fda.vessel_name || "—"}</p>
              <p><strong>IMO:</strong> ${fda.imo || "—"}</p>
              <p><strong>Port:</strong> ${fda.port || "—"}</p>
              <p><strong>Terminal:</strong> ${fda.terminal || "—"}</p>
              <p><strong>Client:</strong> ${fda.client_name || "—"}</p>
              <p><strong>Exchange Rate:</strong> ${fda.exchange_rate} ${fda.currency_base}/${fda.currency_local}</p>
            </div>

            <div class="section">
              <h3>Financial Summary</h3>
              <table>
                <tr>
                  <td><strong>Total AP (Payables)</strong></td>
                  <td class="text-right">$${totals.totalAP_USD.toFixed(2)}</td>
                  <td class="text-right">R$ ${totals.totalAP_BRL.toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Total AR (Receivables)</strong></td>
                  <td class="text-right">$${totals.totalAR_USD.toFixed(2)}</td>
                  <td class="text-right">R$ ${totals.totalAR_BRL.toFixed(2)}</td>
                </tr>
                <tr class="totals">
                  <td><strong>Net ${totals.net_USD >= 0 ? "Due from Client" : "Due to Client"}</strong></td>
                  <td class="text-right">$${Math.abs(totals.net_USD).toFixed(2)}</td>
                  <td class="text-right">R$ ${Math.abs(totals.net_BRL).toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h3>Ledger Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Side</th>
                    <th>Category</th>
                    <th>Counterparty</th>
                    <th>USD</th>
                    <th>BRL</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${fda.ledger.map(entry => `
                    <tr>
                      <td>${entry.line_no}</td>
                      <td>${entry.side}</td>
                      <td>${entry.category || "—"}</td>
                      <td>${entry.counterparty || "—"}</td>
                      <td class="text-right">$${(entry.amount_usd || 0).toFixed(2)}</td>
                      <td class="text-right">R$ ${(entry.amount_local || 0).toFixed(2)}</td>
                      <td>${entry.status}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `;
      
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        toast({
          title: "PDF Generated",
          description: "FDA document opened in new tab. Use Ctrl+P to save as PDF.",
        });
      } else {
        throw new Error('Failed to open new window. Check pop-up blocker settings.');
      }
    } catch (error) {
      console.error('FDA PDF generation failed:', error);
      toast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

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
  const receivables = fda.ledger.filter(entry => entry.side === "AR");
  const payables = fda.ledger.filter(entry => entry.side === "AP");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/fda")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to FDA List
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">FDA {fda.id.slice(-8)}</h1>
            <p className="text-muted-foreground">{fda.vessel_name || "—"} | {fda.port || "—"}</p>
          </div>
        </div>
        <Badge variant={statusVariants[fda.status]}>
          {fda.status}
        </Badge>
      </div>

      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle>FDA Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">VESSEL DETAILS</h4>
              <div className="space-y-1 text-sm">
                <div>Name: {fda.vessel_name || "—"}</div>
                <div>IMO: {fda.imo || "—"}</div>
                <div>Port: {fda.port || "—"}</div>
                <div>Terminal: {fda.terminal || "—"}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">CLIENT INFORMATION</h4>
              <div className="space-y-1 text-sm">
                <div>Client: {fda.client_name || "—"}</div>
                <div>Client ID: {fda.client_id || "—"}</div>
                <div>PDA ID: {fda.pda_id}</div>
                <div>Created: {formatDate(fda.created_at)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">CURRENCY</h4>
              <div className="space-y-1 text-sm">
                <div>Base: {fda.currency_base}</div>
                <div>Local: {fda.currency_local}</div>
                <div>Exchange Rate: {fda.exchange_rate}</div>
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
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <h4 className="text-sm font-medium text-red-700 mb-2">Total Payables (AP)</h4>
              <div className="text-xl font-bold text-red-600">${totals.totalAP_USD.toFixed(2)}</div>
              <div className="text-lg text-red-500">R$ {totals.totalAP_BRL.toFixed(2)}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-700 mb-2">Total Receivables (AR)</h4>
              <div className="text-xl font-bold text-green-600">${totals.totalAR_USD.toFixed(2)}</div>
              <div className="text-lg text-green-500">R$ {totals.totalAR_BRL.toFixed(2)}</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">
                {totals.net_USD >= 0 ? "Due from Client" : "Due to Client"}
              </h4>
              <div className="text-xl font-bold text-blue-600">${Math.abs(totals.net_USD).toFixed(2)}</div>
              <div className="text-lg text-blue-500">R$ {Math.abs(totals.net_BRL).toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Ledger Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="receivables" className="space-y-4">
            <TabsList>
              <TabsTrigger value="receivables">Receivables (AR)</TabsTrigger>
              <TabsTrigger value="payables">Payables (AP)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="receivables">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line #</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead className="text-right">Amount (USD)</TableHead>
                    <TableHead className="text-right">Amount (BRL)</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.line_no}</TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.counterparty}</TableCell>
                      <TableCell className="text-right">${(entry.amount_usd || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {(entry.amount_local || 0).toFixed(2)}</TableCell>
                      <TableCell>{entry.invoice_no || "—"}</TableCell>
                      <TableCell>{entry.due_date || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="payables">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line #</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead className="text-right">Amount (USD)</TableHead>
                    <TableHead className="text-right">Amount (BRL)</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.line_no}</TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.counterparty}</TableCell>
                      <TableCell className="text-right">${(entry.amount_usd || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {(entry.amount_local || 0).toFixed(2)}</TableCell>
                      <TableCell>{entry.invoice_no || "—"}</TableCell>
                      <TableCell>{entry.due_date || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleGeneratePDF} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            
            {fda.status === "Draft" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmRebuild(true)}
                  disabled={loading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rebuild from PDA
                </Button>
                <Button 
                  onClick={() => setConfirmPost(true)}
                  disabled={loading}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Post FDA
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rebuild Confirmation Dialog */}
      <Dialog open={confirmRebuild} onOpenChange={setConfirmRebuild}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rebuild FDA from PDA</DialogTitle>
            <DialogDescription>
              This will refresh amounts from the linked PDA. Manual edits will be preserved when possible. 
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRebuild(false)}>
              Cancel
            </Button>
            <Button onClick={handleRebuildFromPda} disabled={loading}>
              {loading ? "Rebuilding..." : "Confirm Rebuild"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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