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

      const { data, error } = await supabase
        .from("fda_ledger")
        .select("id, fda_id, description, category, amount_usd, amount_local, due_date, status, side")
        .eq("tenant_id", tenantId)
        .gte("due_date", startStr)
        .lte("due_date", endStr)
        .not("due_date", "is", null)
        .order("due_date", { ascending: true });

      if (error) throw error;

      return (data || []) as FDAScheduleItem[];
    },
    enabled: !!tenantId,
  });
};
