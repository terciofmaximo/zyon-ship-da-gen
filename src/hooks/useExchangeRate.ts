import { useEffect, useState } from "react";
import { getUsdBrlToday } from "@/services/exchange";

export function useUsdBrlToday(auto = true) {
  const [data, setData] = useState<{ rate: number; ts: string; source: string } | null>(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getUsdBrlToday();
      setData(r);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch PTAX");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auto) refresh();
  }, [auto]);

  return { data, loading, error, refresh };
}
