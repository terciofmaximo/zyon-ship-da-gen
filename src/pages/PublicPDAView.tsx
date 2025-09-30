import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Share2, Copy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type PDADetail = {
  id: string;
  tracking_id: string;
  vessel_name: string;
  port_name: string;
  status: string;
  created_at: string;
  imo_number: string | null;
  terminal: string | null;
  berth: string | null;
  [key: string]: any;
};

export default function PublicPDAView() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const navigate = useNavigate();
  const [pda, setPda] = useState<PDADetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPDA();
  }, [trackingId]);

  const loadPDA = async () => {
    if (!trackingId) {
      setError("No tracking ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("pdas")
        .select("*")
        .eq("tracking_id", trackingId.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setError("PDA not found");
      } else {
        setPda(data);
      }
    } catch (error: any) {
      setError("Failed to load PDA");
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Tracking link copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (error || !pda) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-bold">PDA Not Found</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-muted-foreground">{error || "PDA not found"}</p>
              <Button onClick={() => navigate("/pda")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to PDAs
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-bold">PDA {pda.tracking_id}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" onClick={() => navigate("/pda")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pre-Departure Approval</CardTitle>
                <CardDescription>Tracking ID: {pda.tracking_id}</CardDescription>
              </div>
              <Badge variant="outline" className="text-base px-3 py-1">
                {pda.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Vessel Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Vessel Name</dt>
                    <dd className="font-medium">{pda.vessel_name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">IMO Number</dt>
                    <dd className="font-mono">{pda.imo_number || "-"}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Port Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Port</dt>
                    <dd className="font-medium">{pda.port_name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Terminal</dt>
                    <dd>{pda.terminal || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Berth</dt>
                    <dd>{pda.berth || "-"}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Details</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd>{new Date(pda.created_at).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share This PDA
            </CardTitle>
            <CardDescription>
              Anyone with this link can view this PDA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
              />
              <Button onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
