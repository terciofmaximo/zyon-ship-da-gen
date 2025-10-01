import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const BCB_BASE = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fmt = (d: Date) => 
  `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${d.getFullYear()}`;

async function fetchDay(date: Date) {
  const q = `${BCB_BASE}/CotacaoDolarDia(dataCotacao='${fmt(date)}')?$top=1&$format=json`;
  const r = await fetch(q);
  if (!r.ok) return { value: [] };
  return await r.json();
}

async function fetchLatestUntil(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - 10);
  const q = `${BCB_BASE}/CotacaoDolarPeriodo(dataInicial='${fmt(start)}',dataFinalCotacao='${fmt(date)}')?$top=1&$orderby=dataHoraCotacao%20desc&$format=json`;
  const r = await fetch(q);
  if (!r.ok) return { value: [] };
  return await r.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date();
    let rows = (await fetchDay(today)).value ?? [];
    if (!rows.length) rows = (await fetchLatestUntil(today)).value ?? [];
    if (!rows.length) {
      return new Response(
        JSON.stringify({ error: "No PTAX found" }), 
        { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { cotacaoCompra, dataHoraCotacao } = rows[0];
    return new Response(
      JSON.stringify({ rate: cotacaoCompra, ts: dataHoraCotacao, source: "BCB_PTAX_D1" }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching PTAX:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch PTAX" }), 
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
