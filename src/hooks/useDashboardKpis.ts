import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfQuarter, endOfQuarter, subQuarters } from "date-fns";

interface DashboardKpis {
  pdaCount: number;
  pdaPrevCount: number;
  fdaOpenCount: number;
  revenueThisQ: number;
  revenuePrevQ: number;
  arOpenTotal: number;
  apOpenTotal: number;
}

export function useDashboardKpis(activeOrgId: string | null) {
  return useQuery<DashboardKpis>({
    queryKey: ["dashboardKpis", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) {
        return {
          pdaCount: 0,
          pdaPrevCount: 0,
          fdaOpenCount: 0,
          revenueThisQ: 0,
          revenuePrevQ: 0,
          arOpenTotal: 0,
          apOpenTotal: 0,
        };
      }

      const now = new Date();
      const thisQStart = startOfQuarter(now);
      const thisQEnd = endOfQuarter(now);
      const prevQStart = startOfQuarter(subQuarters(now, 1));
      const prevQEnd = endOfQuarter(subQuarters(now, 1));

      // 1. PDAs geradas (trimestre corrente)
      const { count: pdaCount } = await supabase
        .from("pdas")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", activeOrgId)
        .gte("created_at", thisQStart.toISOString())
        .lte("created_at", thisQEnd.toISOString());

      // PDAs trimestre anterior
      const { count: pdaPrevCount } = await supabase
        .from("pdas")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", activeOrgId)
        .gte("created_at", prevQStart.toISOString())
        .lte("created_at", prevQEnd.toISOString());

      // 2. FDAs abertas (Draft e Posted = em operação)
      const { count: fdaOpenCount } = await supabase
        .from("fda")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", activeOrgId)
        .in("status", ["Draft", "Posted"]);

      // 3. Total revenue (trimestre corrente) - Agency fee, Service fee, Supervision fee
      const { data: revenueThisQData } = await supabase
        .from("fda_ledger")
        .select("amount_usd, fda!inner(tenant_id, created_at)")
        .eq("fda.tenant_id", activeOrgId)
        .eq("side", "AR")
        .in("category", ["Agency fee", "Service fee", "Supervision fee"])
        .gte("fda.created_at", thisQStart.toISOString())
        .lte("fda.created_at", thisQEnd.toISOString());

      const revenueThisQ = revenueThisQData?.reduce(
        (sum, row) => sum + (parseFloat(row.amount_usd?.toString() || "0") || 0),
        0
      ) || 0;

      // Revenue trimestre anterior
      const { data: revenuePrevQData } = await supabase
        .from("fda_ledger")
        .select("amount_usd, fda!inner(tenant_id, created_at)")
        .eq("fda.tenant_id", activeOrgId)
        .eq("side", "AR")
        .in("category", ["Agency fee", "Service fee", "Supervision fee"])
        .gte("fda.created_at", prevQStart.toISOString())
        .lte("fda.created_at", prevQEnd.toISOString());

      const revenuePrevQ = revenuePrevQData?.reduce(
        (sum, row) => sum + (parseFloat(row.amount_usd?.toString() || "0") || 0),
        0
      ) || 0;

      // 4. Pendências - AR open
      const { data: arOpenData } = await supabase
        .from("fda_ledger")
        .select("amount_usd")
        .eq("tenant_id", activeOrgId)
        .eq("side", "AR")
        .eq("status", "Open");

      const arOpenTotal = arOpenData?.reduce(
        (sum, row) => sum + (parseFloat(row.amount_usd?.toString() || "0") || 0),
        0
      ) || 0;

      // Pendências - AP open
      const { data: apOpenData } = await supabase
        .from("fda_ledger")
        .select("amount_usd")
        .eq("tenant_id", activeOrgId)
        .eq("side", "AP")
        .eq("status", "Open");

      const apOpenTotal = apOpenData?.reduce(
        (sum, row) => sum + (parseFloat(row.amount_usd?.toString() || "0") || 0),
        0
      ) || 0;

      return {
        pdaCount: pdaCount || 0,
        pdaPrevCount: pdaPrevCount || 0,
        fdaOpenCount: fdaOpenCount || 0,
        revenueThisQ,
        revenuePrevQ,
        arOpenTotal,
        apOpenTotal,
      };
    },
    enabled: !!activeOrgId,
  });
}
