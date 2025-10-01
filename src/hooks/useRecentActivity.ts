import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItem {
  ts: string;
  type: "pda" | "ledger";
  title: string;
  subtitle: string;
  amount?: number;
  href: string;
  timeAgo: string;
}

export function useRecentActivity(activeOrgId: string | null) {
  return useQuery<ActivityItem[]>({
    queryKey: ["recentActivity", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];

      // Buscar PDAs recentes
      const { data: pdas } = await supabase
        .from("pdas")
        .select("id, tracking_id, vessel_name, port_name, to_display_name, status, updated_at, created_at")
        .eq("tenant_id", activeOrgId)
        .order("updated_at", { ascending: false })
        .limit(10);

      // Buscar ledger entries recentes
      const { data: ledgers } = await supabase
        .from("fda_ledger")
        .select("id, fda_id, description, category, amount_usd, status, updated_at, side")
        .eq("tenant_id", activeOrgId)
        .order("updated_at", { ascending: false })
        .limit(10);

      const activities: ActivityItem[] = [];

      // Normalizar PDAs
      pdas?.forEach((pda) => {
        const action =
          pda.status === "SENT"
            ? "PDA enviada"
            : pda.status === "APPROVED"
            ? "PDA aprovada"
            : "PDA criada";
        
        activities.push({
          ts: pda.updated_at,
          type: "pda",
          title: action,
          subtitle: `${pda.vessel_name || "Navio"} • ${pda.port_name || "Porto"}${pda.to_display_name ? ` • ${pda.to_display_name}` : ""}`,
          href: `/pda/${pda.tracking_id || pda.id}`,
          timeAgo: formatDistanceToNow(new Date(pda.updated_at), {
            addSuffix: true,
            locale: ptBR,
          }),
        });
      });

      // Normalizar Ledger entries
      ledgers?.forEach((ledger) => {
        const action =
          ledger.status === "Settled"
            ? "Lançamento liquidado"
            : ledger.status === "Partially Settled"
            ? "Lançamento parcialmente liquidado"
            : "Novo lançamento";

        activities.push({
          ts: ledger.updated_at,
          type: "ledger",
          title: action,
          subtitle: `${ledger.category || ledger.description || "Lançamento"} • ${ledger.side}`,
          amount: parseFloat(ledger.amount_usd?.toString() || "0") || 0,
          href: `/fda/${ledger.fda_id}`,
          timeAgo: formatDistanceToNow(new Date(ledger.updated_at), {
            addSuffix: true,
            locale: ptBR,
          }),
        });
      });

      // Ordenar por timestamp DESC e pegar top 10
      return activities
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, 10);
    },
    enabled: !!activeOrgId,
  });
}
