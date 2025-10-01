/*
 * @ai-context
 * Role: PDA list page - displays all PDAs with filtering, sorting, pagination, and status management.
 * DoD:
 * - Always filter by activeOrg.id unless user is platformAdmin.
 * - Preserve highlighting logic for newly created PDAs (URL param).
 * - Support status updates and PDA→FDA conversion.
 * Constraints:
 * - Maintain RLS policy - regular users only see their org's PDAs.
 * - If adding filters/sorts, update query builder and Tabs.
 * - Preserve pagination logic (start/end range).
 * - Keep status enum mapping (statusLabels, statusVariants).
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, MoreHorizontal, Eye, Check, Download, RefreshCw } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useFDA } from "@/hooks/useFDA";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useOrg } from "@/context/OrgProvider";
import { getActiveTenantId } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

interface PDA {
  id: string;
  pda_number: string;
  vessel_name: string | null;
  port_name: string | null;
  to_display_name: string | null;
  date_field: string | null; // PDA's own date from Step 1
  sent_at: string | null;
  sent_by_user_id: string | null;
  created_by: string | null;
  status: "IN_PROGRESS" | "SENT" | "APPROVED" | "CREATED" | "REJECTED" | "UNDER_REVIEW";
  created_at: string;
  updated_at: string;
}

// New English status constants
export const PDA_STATUS = {
  CREATED: "PDA Created",
  SENT: "PDA Sent", 
  APPROVED: "PDA Approved by Client",
  REJECTED: "PDA Rejected by Client",
  UNDER_REVIEW: "PDA Under Client Review",
} as const;

// Map database enum values to display labels
const statusLabels = {
  IN_PROGRESS: PDA_STATUS.CREATED, // Legacy mapping
  CREATED: PDA_STATUS.CREATED,
  SENT: PDA_STATUS.SENT,
  APPROVED: PDA_STATUS.APPROVED,
  REJECTED: PDA_STATUS.REJECTED,
  UNDER_REVIEW: PDA_STATUS.UNDER_REVIEW,
};

const statusVariants = {
  IN_PROGRESS: "secondary",
  CREATED: "secondary", 
  SENT: "default",
  APPROVED: "default",
  REJECTED: "destructive",
  UNDER_REVIEW: "outline",
} as const;

export default function PDAList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { convertPdaToFda, loading: fdaLoading } = useFDA();
  const { activeOrg } = useOrg();
  const { isPlatformAdmin } = useUserRole();
  const [pdas, setPdas] = useState<PDA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    // platformAdmin can fetch without activeOrg, regular users need activeOrg
    if (isPlatformAdmin || activeOrg) {
      fetchPDAs();
    }
  }, [sortBy, currentPage, pageSize, activeOrg, isPlatformAdmin]);

  useEffect(() => {
    // Handle highlighting from URL params
    const highlighted = searchParams.get('highlighted');
    if (highlighted && pdas.length > 0) {
      setHighlightedId(highlighted);
      
      // Scroll to highlighted row after a short delay to ensure it's rendered
      setTimeout(() => {
        const highlightedRow = document.querySelector(`[data-pda-id="${highlighted}"]`);
        if (highlightedRow) {
          highlightedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      // Remove highlighting after 3 seconds
      setTimeout(() => {
        setHighlightedId(null);
        // Remove the parameter from URL without triggering navigation
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('highlighted');
        setSearchParams(newSearchParams, { replace: true });
      }, 3000);
    }
  }, [pdas, searchParams, setSearchParams]);

  const fetchPDAs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("pdas")
        .select("id, pda_number, vessel_name, port_name, to_display_name, date_field, sent_at, sent_by_user_id, created_by, status, created_at, updated_at");

      // platformAdmin sees all orgs, regular users only see their active org
      if (!isPlatformAdmin && activeOrg) {
        const tenantId = getActiveTenantId(activeOrg);
        if (tenantId) {
          query = query.eq("tenant_id", tenantId);
        }
      }

      // Apply sorting
      switch (sortBy) {
        case "updated_desc":
          query = query.order("updated_at", { ascending: false });
          break;
        case "date_desc":
          query = query.order("date_field", { ascending: false, nullsFirst: false });
          break;
        case "date_asc":
          query = query.order("date_field", { ascending: true, nullsFirst: true });
          break;
        case "sent_desc":
          query = query.order("sent_at", { ascending: false, nullsFirst: false });
          break;
        case "sent_asc":
          query = query.order("sent_at", { ascending: true, nullsFirst: true });
          break;
        case "pda_asc":
          query = query.order("pda_number", { ascending: true });
          break;
        case "pda_desc":
          query = query.order("pda_number", { ascending: false });
          break;
      }

      // Apply pagination
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);

      const { data, error } = await query;

      if (error) throw error;
      setPdas(data || []);
    } catch (error) {
      console.error("Error fetching PDAs:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar PDAs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPDAs = useMemo(() => {
    return pdas.filter((pda) => {
      const matchesSearch = 
        pda.pda_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pda.to_display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (pda.vessel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (pda.port_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter === "all" || pda.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [pdas, searchTerm, statusFilter]);

  const handleSendToBilling = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pdas")
        .update({ 
          status: "SENT",
          sent_at: new Date().toISOString(),
          sent_by_user_id: "mock-user-id", // Will be replaced with actual user ID
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      setPdas(prev => 
        prev.map(pda => 
          pda.id === id 
            ? { 
                ...pda, 
                status: "SENT" as const,
                sent_at: new Date().toISOString(),
                sent_by_user_id: "mock-user-id"
              }
            : pda
        )
      );

      toast({
        title: "Sucesso",
        description: "PDA enviada para cobrança",
      });
    } catch (error) {
      console.error("Error sending PDA:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar PDA",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleConvertToFDA = async (pda: PDA) => {
    setConvertingId(pda.id);
    try {
      const fdaId = await convertPdaToFda(pda.id);
      if (fdaId) {
        navigate(`/fda/${fdaId}`);
      }
    } catch (error) {
      console.error("Error converting to FDA:", error);
      toast({
        title: "Error", 
        description: "Failed to convert to FDA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConvertingId(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: PDA['status']) => {
    try {
      const { error } = await supabase
        .from("pdas")
        .update({ status: status as any }) // Cast to avoid TypeScript enum mismatch
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setPdas(pdas.map(pda => 
        pda.id === id 
          ? { ...pda, status }
          : pda
      ));
      
      toast({
        title: "Success",
        description: "Status updated.",
      });
    } catch (error) {
      console.error("Error updating PDA:", error);
      toast({
        title: "Error",
        description: "Error updating PDA status",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(filteredPDAs.length / pageSize);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando PDAs...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDAs</h1>
          <p className="text-muted-foreground">Gerencie suas Pro Forma Accounts</p>
        </div>
        <Button onClick={() => navigate("/pda/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create New PDA
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PDAs, vessels, ports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_desc">Atualizado (desc)</SelectItem>
                  <SelectItem value="sent_desc">Enviado (desc)</SelectItem>
                  <SelectItem value="sent_asc">Enviado (asc)</SelectItem>
                  <SelectItem value="pda_asc">PDA # (asc)</SelectItem>
                  <SelectItem value="pda_desc">PDA # (desc)</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="created">Created</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="under_review">Under Review</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {filteredPDAs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {pdas.length === 0 ? "No PDAs found" : "No PDAs match the current filters"}
              </div>
              {pdas.length === 0 && (
                <Button onClick={() => navigate("/pda/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New PDA
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDA #</TableHead>
                    <TableHead>Vessel</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Client (To)</TableHead>
                    <TableHead>Sent on</TableHead>
                    <TableHead>Sent by</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPDAs.map((pda) => (
                    <TableRow 
                      key={pda.id} 
                      data-pda-id={pda.id}
                      className={`transition-colors duration-300 ${
                        highlightedId === pda.id 
                          ? "bg-primary/5 border-l-4 border-l-primary shadow-sm" 
                          : ""
                      }`}
                    >
                      <TableCell>
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-primary"
                          onClick={() => navigate(`/pda/${pda.id}/review`)}
                        >
                          {pda.pda_number}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate" title={pda.vessel_name || ""}>
                          {pda.vessel_name || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[120px] truncate" title={pda.port_name || ""}>
                          {pda.port_name || "—"}
                        </div>
                      </TableCell>
                      <TableCell>{pda.to_display_name || "—"}</TableCell>
                      <TableCell>{formatDate(pda.date_field)}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>
                        <Select
                          value={pda.status}
                          onValueChange={(newStatus) => handleUpdateStatus(pda.id, newStatus as PDA['status'])}
                        >
                          <SelectTrigger className="w-[180px] h-8 border-none bg-transparent p-0 hover:bg-muted/50 focus:bg-muted">
                            <Badge 
                              variant={statusVariants[pda.status]}
                              className={`cursor-pointer ${
                                pda.status === "IN_PROGRESS" || pda.status === "CREATED"
                                  ? "bg-muted text-muted-foreground hover:bg-muted/80" 
                                  : pda.status === "SENT"
                                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                                  : pda.status === "APPROVED"
                                  ? "bg-success text-success-foreground hover:bg-success/80"
                                  : pda.status === "REJECTED"
                                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/80"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {statusLabels[pda.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CREATED">PDA Created</SelectItem>
                            <SelectItem value="SENT">PDA Sent</SelectItem>
                            <SelectItem value="APPROVED">PDA Approved by Client</SelectItem>
                            <SelectItem value="REJECTED">PDA Rejected by Client</SelectItem>
                            <SelectItem value="UNDER_REVIEW">PDA Under Client Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {pda.status === "APPROVED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConvertToFDA(pda)}
                            disabled={convertingId === pda.id || fdaLoading}
                            className="text-xs"
                          >
                            {convertingId === pda.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Converting...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Convert to FDA
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/pda/${pda.id}/review`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {/* PDF generation logic */}}>
                              <Download className="mr-2 h-4 w-4" />
                              Generate PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}