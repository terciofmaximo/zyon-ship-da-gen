import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Send, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { CostData } from "@/types";
import type { PDAStep1Data } from "@/schemas/pdaSchema";

interface ReviewFormProps {
  onBack: () => void;
  shipData: Partial<PDAStep1Data>;
  costData: Partial<CostData>;
}

export function ReviewForm({ onBack, shipData, costData }: ReviewFormProps) {
  const { toast } = useToast();
  const totalUSD = Object.values(costData).reduce((sum: number, cost: number) => sum + (cost || 0), 0);
  const totalBRL = totalUSD * parseFloat(shipData.exchangeRate || "5.25");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showDownloadMessage, setShowDownloadMessage] = useState(false);

  const generateAndDownloadPdaPdf = async (pdaId: string) => {
    console.info('[PDA] Generate PDF click', { pdaId });
    
    try {
      const response = await fetch(`https://hxdrffemnrxklrrfnllo.supabase.co/functions/v1/generate-pda-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZHJmZmVtbnJ4a2xycmZubGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjI3MjgsImV4cCI6MjA3NDQ5ODcyOH0.LIwvXuk48EK5NQyse0XtJpOPRUQtBqegX9loVtbvq4g`,
          'Accept': 'application/pdf'
        },
        
        body: JSON.stringify({
          shipData,
          costData,
          costComments: {
            pilotageIn: '', towageIn: '', lightDues: '', dockage: '', linesman: '',
            launchBoat: '', immigration: '', freePratique: '', shippingAssociation: '',
            clearance: '', paperlessPort: '', agencyFee: '', waterway: ''
          },
          remarks: (shipData as any).remarks || ''
        }),
      });

      const ct = response.headers.get('Content-Type') || '';
      const cd = response.headers.get('Content-Disposition') || '';
      console.info('[PDF] response', { 
        status: response.status, 
        ct, 
        cd, 
        redirected: response.redirected,
        ok: response.ok 
      });

      // Diagnostic reporting
      let diagnosis = '';
      let evidence = '';
      let correctionPlan = '';

      if (!response.ok) {
        if (response.status === 404) {
          diagnosis = 'API_NOT_FOUND';
          evidence = `Status 404 - Endpoint not found`;
          correctionPlan = '1. Verify edge function deployment\n2. Check function URL path\n3. Ensure function is accessible';
        } else if (response.status >= 500) {
          diagnosis = 'API_ERROR';
          evidence = `Status ${response.status} - Server error`;
          correctionPlan = '1. Check edge function logs\n2. Verify external API dependencies\n3. Fix server-side errors';
        } else {
          diagnosis = 'API_ERROR';
          evidence = `Status ${response.status} - HTTP error`;
          correctionPlan = '1. Check API authentication\n2. Verify request headers\n3. Review API permissions';
        }
      } else if (response.redirected) {
        diagnosis = 'REDIRECTED_HTML';
        evidence = 'Response was redirected, losing headers';
        correctionPlan = '1. Fix redirect to respond 200 directly\n2. Ensure proper Content-Type headers\n3. Avoid server-side redirects';
      } else if (ct.includes('application/pdf')) {
        // PDF stream case
        const blob = await response.blob();
        setPdfBlob(blob);
        
        const url = URL.createObjectURL(blob);
        const filename = /filename="([^"]+)"/.exec(cd)?.[1] || generateFilename();
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        
        setShowDownloadMessage(true);
        toast({ title: "PDF gerado e baixado com sucesso" });
        console.info('[PDF] Success - Stream download completed');
        return;
      } else if (ct.includes('application/json')) {
        // JSON with fileUrl case
        const data = await response.json();
        if (data?.fileUrl) {
          const a = document.createElement('a');
          a.href = data.fileUrl;
          a.download = data.filename || generateFilename();
          document.body.appendChild(a);
          a.click();
          a.remove();
          toast({ title: "PDF baixado pelo link" });
          console.info('[PDF] Success - URL download completed');
          return;
        } else {
          diagnosis = 'NO_FILE_URL';
          evidence = 'JSON response without fileUrl property';
          correctionPlan = '1. Include fileUrl in JSON response\n2. Generate signed URL for file access\n3. Enable CORS for file domain';
        }
      } else {
        diagnosis = 'WRONG_CONTENT_TYPE';
        evidence = `Content-Type: ${ct} (expected application/pdf or application/json)`;
        correctionPlan = '1. Set Content-Type: application/pdf for stream\n2. Or return JSON with fileUrl\n3. Add Content-Disposition headers';
      }

      // Log structured diagnostic report
      const diagnosticReport = {
        diagnosis,
        evidence,
        correctionPlan: correctionPlan.split('\n'),
        responseDetails: { status: response.status, contentType: ct, redirected: response.redirected }
      };

      console.error('[PDF] Diagnostic Report:', diagnosticReport);
      toast({ 
        title: `PDF: ${diagnosis}`, 
        description: "Ver console para detalhes do diagnóstico",
        variant: "destructive"
      });

    } catch (error: any) {
      let diagnosis = '';
      let evidence = '';
      let correctionPlan = '';

      if (error.message?.includes('Failed to fetch') || error.message?.includes('CORS')) {
        diagnosis = 'CORS_BLOCKED';
        evidence = 'Network error or CORS policy blocking request';
        correctionPlan = '1. Add CORS headers to edge function\n2. Verify domain whitelist\n3. Check network connectivity';
      } else {
        diagnosis = 'NETWORK_ERROR';
        evidence = error.message || 'Unknown network error';
        correctionPlan = '1. Check internet connection\n2. Verify API endpoint\n3. Review request configuration';
      }

      const diagnosticReport = {
        diagnosis,
        evidence,
        correctionPlan: correctionPlan.split('\n'),
        error: error.message
      };

      console.error('[PDF] Diagnostic Report:', diagnosticReport);
      toast({ 
        title: `PDF: ${diagnosis}`, 
        description: "Ver console para detalhes do diagnóstico",
        variant: "destructive"
      });
    }
  };

  const generateFilename = () => {
    const vesselName = shipData.vesselName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
    const portName = shipData.portName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
    const date = shipData.date?.replace(/\//g, '-') || new Date().toISOString().split('T')[0];
    return `PDA_${vesselName}_${portName}_${date}.pdf`;
  };

  const handleGeneratePDF = async () => {
    const pdaId = `${shipData.vesselName}_${Date.now()}`;
    await generateAndDownloadPdaPdf(pdaId);
  };

  const handleConvertToFDA = () => {
    // Mock FDA conversion
    console.log("Converting to FDA...");
  };

  const handleSendToBilling = () => {
    // Mock billing integration
    console.log("Sending to billing system...");
  };

  const costItems = [
    { label: "1. Pilot IN/OUT", value: costData.pilotageIn },
    { label: "2. Towage IN/OUT", value: costData.towageIn },
    { label: "3. Light dues", value: costData.lightDues },
    { label: "4. Dockage (Wharfage)", value: costData.dockage },
    { label: "5. Linesman (mooring/unmooring)", value: costData.linesman },
    { label: "6. Launch boat (mooring/unmooring)", value: costData.launchBoat },
    { label: "7. Immigration tax (Funapol)", value: costData.immigration },
    { label: "8. Free pratique tax", value: costData.freePratique },
    { label: "9. Shipping association", value: costData.shippingAssociation },
    { label: "10. Clearance", value: costData.clearance },
    { label: "11. Paperless Port System", value: costData.paperlessPort },
    { label: "12. Agency fee", value: costData.agencyFee },
    { label: "13. Waterway channel (Table I)", value: costData.waterway },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            PDA Review - {shipData.vesselName}
          </CardTitle>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <Badge variant="outline" className="text-xs">IMO: {shipData.imoNumber}</Badge>
            <Badge variant="outline" className="text-xs">DWT: {shipData.dwt}t</Badge>
            <Badge variant="outline" className="text-xs">LOA: {shipData.loa}m</Badge>
            <Badge variant="outline" className="text-xs">{shipData.portName}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground">VESSEL DETAILS</h4>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="truncate">Name: {shipData.vesselName}</div>
                <div>Cargo: {shipData.cargo}</div>
                <div>Terminal: {shipData.berth}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground">SCHEDULE</h4>
              <div className="space-y-1 text-xs sm:text-sm">
                <div>Date: {shipData.date}</div>
                <div>Days alongside: {shipData.daysAlongside}</div>
                <div>Rate: {shipData.exchangeRate}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground">TOTALS</h4>
              <div className="space-y-1">
                <div className="text-base sm:text-lg font-bold text-primary">
                  ${totalUSD.toFixed(2)}
                </div>
                <div className="text-base sm:text-lg font-bold text-accent">
                  R$ {totalBRL.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Description</TableHead>
                  <TableHead className="text-right min-w-[100px]">USD</TableHead>
                  <TableHead className="text-right min-w-[100px] hidden sm:table-cell">BRL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costItems.map((item, index) => (
                   <TableRow key={index}>
                     <TableCell className="font-medium text-xs sm:text-sm">{item.label}</TableCell>
                     <TableCell className="text-right text-xs sm:text-sm">
                       <div className="flex flex-col sm:block">
                         <span>${(item.value || 0).toFixed(2)}</span>
                         <span className="sm:hidden text-muted-foreground text-xs">
                           R$ {((item.value || 0) * parseFloat(shipData.exchangeRate || "5.25")).toFixed(2)}
                         </span>
                       </div>
                     </TableCell>
                     <TableCell className="text-right text-xs sm:text-sm hidden sm:table-cell">
                       R$ {((item.value || 0) * parseFloat(shipData.exchangeRate || "5.25")).toFixed(2)}
                     </TableCell>
                   </TableRow>
                ))}
                <TableRow className="border-t-2 border-primary font-bold">
                  <TableCell className="text-xs sm:text-sm">TOTAL</TableCell>
                  <TableCell className="text-right text-primary text-xs sm:text-sm">
                    <div className="flex flex-col sm:block">
                      <span>${totalUSD.toFixed(2)}</span>
                      <span className="sm:hidden text-accent text-xs">
                        R$ {totalBRL.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-accent text-xs sm:text-sm hidden sm:table-cell">
                    R$ {totalBRL.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-transparent shadow-soft rounded-xl">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex flex-col">
              <Button onClick={handleGeneratePDF} className="h-10 sm:h-12 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary-hover">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Generate PDF
              </Button>
              {showDownloadMessage && (
                <p className="text-xs text-muted-foreground mt-2">
                  If the download didn't start automatically,{" "}
                  <button
                    onClick={() => {
                      if (pdfBlob) {
                        const url = window.URL.createObjectURL(pdfBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        const vesselName = shipData.vesselName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
                        const portName = shipData.portName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
                        const date = shipData.date?.replace(/\//g, '-') || new Date().toISOString().split('T')[0];
                        a.download = `PDA_${vesselName}_${portName}_${date}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      }
                    }}
                    className="text-primary hover:underline"
                  >
                    click here
                  </button>
                </p>
              )}
            </div>
            <Button onClick={handleConvertToFDA} className="h-10 sm:h-12 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary-hover">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Convert to </span>FDA
            </Button>
            <Button onClick={handleSendToBilling} className="h-10 sm:h-12 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary-hover sm:col-span-2 lg:col-span-1">
              <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Send to Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
        <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
          Back: Cost Entry
        </Button>
        <Button onClick={handleGeneratePDF} className="px-4 sm:px-8 w-full sm:w-auto">
          Complete PDA
        </Button>
      </div>
    </div>
  );
}