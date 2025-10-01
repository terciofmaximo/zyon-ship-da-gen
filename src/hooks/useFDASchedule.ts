import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface FDAScheduleItem {
  id: string;
  fda_id: string;
  description: string | null;
  category: string | null;
  amount_usd: number | null;
  amount_local: number | null;
  due_date: string | null;
  status: string;
  side: "AP" | "AR";
}

export interface FDAMilestone {
  id: string;
  vessel_name: string | null;
  port: string | null;
  eta: string | null;
  etb: string | null;
  ets: string | null;
}

interface UseFDAScheduleParams {
  monthStart: Date;
  monthEnd: Date;
  tenantId: string | null;
}

export const useFDASchedule = ({ monthStart, monthEnd, tenantId }: UseFDAScheduleParams) => {
  return useQuery({
    queryKey: ["fda-schedule", tenantId, format(monthStart, "yyyy-MM"), format(monthEnd, "yyyy-MM")],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }

      const startStr = format(monthStart, "yyyy-MM-dd");
      const endStr = format(monthEnd, "yyyy-MM-dd");

      // Fetch financial dues
      const { data: items, error: itemsError } = await supabase
        .from("fda_ledger")
        .select("id, fda_id, description, category, amount_usd, amount_local, due_date, status, side")
        .eq("tenant_id", tenantId)
        .gte("due_date", startStr)
        .lte("due_date", endStr)
        .not("due_date", "is", null)
        .order("due_date", { ascending: true });

      if (itemsError) throw itemsError;

      // Fetch FDA milestones (ETA, ETB, ETS)
      const { data: fdas, error: fdasError } = await supabase
        .from("fda")
        .select("id, vessel_name, port, eta, etb, ets")
        .eq("tenant_id", tenantId)
        .or(`eta.gte.${startStr},etb.gte.${startStr},ets.gte.${startStr}`)
        .or(`eta.lte.${endStr},etb.lte.${endStr},ets.lte.${endStr}`)
        .order("eta", { ascending: true, nullsFirst: false });

      if (fdasError) throw fdasError;

      return {
        items: (items || []) as FDAScheduleItem[],
        fdas: (fdas || []) as FDAMilestone[],
      };
    },
    enabled: !!tenantId,
  });
};
