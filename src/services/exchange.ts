const BCB_BASE = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";

// Formato exigido pelo BCB: MM-DD-YYYY
const fmt = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${d.getFullYear()}`;

type BCBResp = { cotacaoCompra: number; dataHoraCotacao: string }[];

let _cache: { dateKey: string; rate: number; ts: string } | null = null;

async function fetchDay(date: Date) {
  const q = `${BCB_BASE}/CotacaoDolarDia(dataCotacao='${fmt(date)}')?$top=1&$format=json`;
  const r = await fetch(q);
  if (!r.ok) throw new Error("BCB error");
  const j = await r.json();
  return (j?.value as BCBResp) ?? [];
}

// fallback: busca período até hoje e pega a última cotação (útil p/ fim de semana/feriado)
async function fetchLatestUntil(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - 10); // janela de 10 dias
  const q = `${BCB_BASE}/CotacaoDolarPeriodo(dataInicial='${fmt(start)}',dataFinalCotacao='${fmt(date)}')?$top=1&$orderby=dataHoraCotacao%20desc&$format=json`;
  const r = await fetch(q);
  if (!r.ok) throw new Error("BCB error (period)");
  const j = await r.json();
  return (j?.value as BCBResp) ?? [];
}

export async function getUsdBrlToday(): Promise<{ rate: number; ts: string; source: string }> {
  const today = new Date();
  const key = fmt(today);
  if (_cache && _cache.dateKey === key) {
    return { rate: _cache.rate, ts: _cache.ts, source: "BCB_PTAX_D1" };
  }

  let rows = await fetchDay(today);
  if (!rows.length) rows = await fetchLatestUntil(today);
  if (!rows.length) throw new Error("No PTAX found");

  const { cotacaoCompra, dataHoraCotacao } = rows[0];
  _cache = { dateKey: key, rate: cotacaoCompra, ts: dataHoraCotacao };
  return { rate: cotacaoCompra, ts: dataHoraCotacao, source: "BCB_PTAX_D1" };
}
