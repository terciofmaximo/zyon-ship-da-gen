import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FDA } from "@/types/fda";
import { useFDA } from "@/hooks/useFDA";
import { useOrg } from "@/context/OrgProvider";
import { useUserRole } from "@/hooks/useUserRole";

const statusVariants = {
  Draft: "secondary",
  Posted: "default", 
  Closed: "outline",
} as const;

interface FDAWithTotals extends FDA {
  total_ap_usd: number;
  total_ar_usd: number;
  net_usd: number;
  pda_number?: string;
}

export default function FDAList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { calculateFDATotals } = useFDA();
  const { activeOrg } = useOrg();
  const { isPlatformAdmin } = useUserRole();
  const [fdas, setFdas] = useState<FDAWithTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("updated_desc");

  useEffect(() => {
    // platformAdmin can fetch without activeOrg, regular users need activeOrg
    if (isPlatformAdmin || activeOrg) {
      fetchFDAs();
    }
  }, [sortBy, activeOrg, isPlatformAdmin]);

  const fetchFDAs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("fda")
        .select(`
          *,
          fda_ledger(amount_usd, side)
        `);

      // platformAdmin sees all orgs, regular users only see their active org
      if (!isPlatformAdmin && activeOrg) {
        query = query.eq("tenant_id", activeOrg.id);
      }

      // Apply sorting
      switch (sortBy) {
        case "updated_desc":
          query = query.order("updated_at", { ascending: false });
          break;
        case "created_desc":
          query = query.order("created_at", { ascending: false });
          break;
        case "created_asc":
          query = query.order("created_at", { ascending: true });
          break;
        case "status_asc":
          query = query.order("status", { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get PDA numbers for FDAs that have pda_id
      const fdaWithPdaIds = data?.filter(fda => fda.pda_id) || [];
      let pdaNumbers: Record<string, string> = {};
      
      if (fdaWithPdaIds.length > 0) {
        const pdaIds = fdaWithPdaIds.map(fda => fda.pda_id);
        const { data: pdaData } = await supabase
          .from("pdas")
          .select("id, pda_number")
          .in("id", pdaIds);
        
        if (pdaData) {
          pdaNumbers = pdaData.reduce((acc, pda) => {
            acc[pda.id] = pda.pda_number;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Calculate totals for each FDA
      const fdasWithTotals: FDAWithTotals[] = (data || []).map((fda: any) => {
        const ledger = fda.fda_ledger || [];
        const totals = calculateFDATotals(ledger);
        
        return {
          ...fda,
          total_ap_usd: totals.totalAP_USD,
          total_ar_usd: totals.totalAR_USD,
          net_usd: totals.net_USD,
          pda_number: fda.pda_id ? pdaNumbers[fda.pda_id] : undefined,
        };
      });

      setFdas(fdasWithTotals);
    } catch (error) {
      console.error("Error fetching FDAs:", error);
      toast({
        title: "Error",
        description: "Failed to load FDAs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFDAs = useMemo(() => {
    return fdas.filter((fda) => {
      const matchesSearch = 
        fda.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fda.pda_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (fda.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (fda.vessel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (fda.port?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter === "all" || fda.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [fdas, searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleExportPDF = (fda: FDAWithTotals) => {
    // Navigate to FDA detail page which has PDF export functionality
    navigate(`/fda/${fda.id}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading FDAs...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FDAs</h1>
          <p className="text-muted-foreground">Manage your Final Disbursement Accounts</p>
        </div>
        <Button onClick={() => navigate("/fda/new")}>
          Create New FDA
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FDAs, vessels, clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_desc">Updated (desc)</SelectItem>
                  <SelectItem value="created_desc">Created (desc)</SelectItem>
                  <SelectItem value="created_asc">Created (asc)</SelectItem>
                  <SelectItem value="status_asc">Status (asc)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Draft">Draft</TabsTrigger>
              <TabsTrigger value="Posted">Posted</TabsTrigger>
              <TabsTrigger value="Closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {filteredFDAs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {fdas.length === 0 ? "No FDAs found" : "No FDAs match the current filters"}
              </div>
              {fdas.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  FDAs are created from approved PDAs. Go to the PDA list to convert an approved PDA to FDA.
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FDA #</TableHead>
                  <TableHead>PDA #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Vessel</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead className="text-right">Total AP (USD)</TableHead>
                  <TableHead className="text-right">Total AR (USD)</TableHead>
                  <TableHead className="text-right">Net (USD)</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFDAs.map((fda) => (
                  <TableRow key={fda.id}>
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-primary"
                        onClick={() => navigate(`/fda/${fda.id}`)}
                      >
                        {fda.id.slice(-8)}
                      </Button>
                    </TableCell>
                    <TableCell>{fda.pda_number || "—"}</TableCell>
                    <TableCell>
                      <div className="max-w-[120px] truncate" title={fda.client_name || ""}>
                        {fda.client_name || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate" title={fda.vessel_name || ""}>
                        {fda.vessel_name || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[120px] truncate" title={fda.port || ""}>
                        {fda.port || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[fda.status]}>
                        {fda.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(fda.created_at)}</TableCell>
                    <TableCell className="text-right text-red-600">
                      ${fda.total_ap_usd.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ${fda.total_ar_usd.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      fda.net_usd >= 0 ? "text-blue-600" : "text-orange-600"
                    }`}>
                      ${Math.abs(fda.net_usd).toFixed(2)}
                      {fda.net_usd < 0 && " (owe)"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            ⋯
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/fda/${fda.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportPDF(fda)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}