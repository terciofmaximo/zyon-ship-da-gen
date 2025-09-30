import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/utils/sessionTracking";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type PDA = {
  id: string;
  tracking_id: string;
  vessel_name: string;
  port_name: string;
  status: string;
  created_at: string;
};

export default function PublicPDAList() {
  const navigate = useNavigate();
  const [sessionPDAs, setSessionPDAs] = useState<PDA[]>([]);
  const [searchTrackingId, setSearchTrackingId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessionPDAs();
  }, []);

  const loadSessionPDAs = async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pdas")
        .select("id, tracking_id, vessel_name, port_name, status, created_at")
        .eq("created_by_session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSessionPDAs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load PDAs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByTracking = async () => {
    if (!searchTrackingId.trim()) {
      toast({
        title: "Enter Tracking ID",
        description: "Please enter a tracking ID to search",
        variant: "destructive",
      });
      return;
    }

    navigate(`/pda/${searchTrackingId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-bold">My PDAs</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/pda/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New PDA
            </Button>
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search by Tracking ID</CardTitle>
            <CardDescription>
              Enter a tracking ID to view any PDA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter tracking ID (e.g., ABC12345)"
                value={searchTrackingId}
                onChange={(e) => setSearchTrackingId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearchByTracking()}
              />
              <Button onClick={handleSearchByTracking}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PDAs Created in This Session</CardTitle>
            <CardDescription>
              PDAs you've created during this browser session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : sessionPDAs.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">No PDAs created yet</p>
                <Button onClick={() => navigate("/pda/new")}>
                  Create Your First PDA
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Vessel</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionPDAs.map((pda) => (
                    <TableRow key={pda.id}>
                      <TableCell className="font-mono font-semibold">
                        {pda.tracking_id}
                      </TableCell>
                      <TableCell>{pda.vessel_name || "-"}</TableCell>
                      <TableCell>{pda.port_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pda.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(pda.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/pda/${pda.tracking_id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
