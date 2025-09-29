import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, MoreHorizontal, Eye, Check, Download } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PDA {
  id: string;
  pda_number: string;
  to_display_name: string | null;
  sent_at: string | null;
  sent_by_user_id: string | null;
  status: "IN_PROGRESS" | "SENT" | "APPROVED";
  created_at: string;
  updated_at: string;
}

const statusLabels = {
  IN_PROGRESS: "Em andamento",
  SENT: "Enviada",
  APPROVED: "Aprovada",
};

const statusVariants = {
  IN_PROGRESS: "secondary",
  SENT: "default",
  APPROVED: "default",
} as const;

export default function PDAList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [pdas, setPdas] = useState<PDA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [confirmApprovalId, setConfirmApprovalId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    fetchPDAs();
  }, [sortBy, currentPage, pageSize]);

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
      // For now using hardcoded user ID as tenant - will be replaced with proper auth
      const mockTenantId = "123e4567-e89b-12d3-a456-426614174000";
      
      let query = supabase
        .from("pdas")
        .select("*")
        .eq("tenant_id", mockTenantId);

      // Apply sorting
      switch (sortBy) {
        case "updated_desc":
          query = query.order("updated_at", { ascending: false });
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
        (pda.to_display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter === "all" || pda.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [pdas, searchTerm, statusFilter]);

  const handleMarkAsApproved = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pdas")
        .update({ 
          status: "APPROVED",
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      setPdas(prev => 
        prev.map(pda => 
          pda.id === id 
            ? { ...pda, status: "APPROVED" as const }
            : pda
        )
      );

      toast({
        title: "Sucesso",
        description: "PDA marcada como aprovada",
      });
    } catch (error) {
      console.error("Error updating PDA:", error);
      toast({
        title: "Erro",
        description: "Erro ao marcar PDA como aprovada",
        variant: "destructive",
      });
    }
    setConfirmApprovalId(null);
  };

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
    return new Date(dateString).toLocaleDateString("pt-BR");
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
                  placeholder="Buscar por número ou cliente..."
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
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="IN_PROGRESS">Em andamento</TabsTrigger>
              <TabsTrigger value="SENT">Enviadas</TabsTrigger>
              <TabsTrigger value="APPROVED">Aprovadas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {filteredPDAs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {pdas.length === 0 ? "Nenhuma PDA encontrada" : "Nenhuma PDA corresponde aos filtros"}
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
                    <TableHead>Client (To)</TableHead>
                    <TableHead>Sent on</TableHead>
                    <TableHead>Sent by</TableHead>
                    <TableHead>Status</TableHead>
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
                      <TableCell>{pda.to_display_name || "—"}</TableCell>
                      <TableCell>{formatDate(pda.sent_at)}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>
                        <Badge 
                          variant={statusVariants[pda.status]}
                          className={
                            pda.status === "IN_PROGRESS" 
                              ? "bg-muted text-muted-foreground" 
                              : pda.status === "SENT"
                              ? "bg-primary text-primary-foreground"
                              : "bg-success text-success-foreground"
                          }
                        >
                          {statusLabels[pda.status]}
                        </Badge>
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
                              Open
                            </DropdownMenuItem>
                            {pda.status !== "APPROVED" && (
                              <DropdownMenuItem onClick={() => setConfirmApprovalId(pda.id)}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Approved
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {/* PDF generation logic */}}>
                              <Download className="mr-2 h-4 w-4" />
                              Generate PDF
                            </DropdownMenuItem>
                            {pda.status === "IN_PROGRESS" && (
                              <DropdownMenuItem onClick={() => handleSendToBilling(pda.id)}>
                                Send to Billing
                              </DropdownMenuItem>
                            )}
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

      <Dialog open={!!confirmApprovalId} onOpenChange={() => setConfirmApprovalId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar aprovação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar esta PDA como aprovada? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApprovalId(null)}>
              Cancelar
            </Button>
            <Button onClick={() => confirmApprovalId && handleMarkAsApproved(confirmApprovalId)}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}