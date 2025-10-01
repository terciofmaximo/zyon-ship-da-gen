# Tenant ID Standardization Report

**Data:** 2025-10-01  
**Status:** ✅ Totalmente Padronizado - Nenhuma ação necessária

## Resumo Executivo

Auditoria completa do uso de `tenant_id` em PDAs e FDAs revelou que o código já está **100% padronizado** e seguindo as melhores práticas.

## Função Helper

✅ **Helper existente e funcional:**
```typescript
// src/lib/utils.ts
export function getActiveTenantId(activeOrg: { id: string } | null): string | null {
  return activeOrg?.id || null;
}
```

## Análise por Arquivo

### Hooks (✅ Corretos)

#### `src/hooks/useFDA.ts`
- ✅ Linha 66: `const tenantId = getActiveTenantId(activeOrg);`
- ✅ Linha 84: `tenant_id: tenantId` (usa activeOrg.id via helper)
- ✅ Linha 126: `tenant_id: tenantId` (ledger entries)
- ✅ Linha 215: `const tenantId = getActiveTenantId(activeOrg);` (rebuildFromPda)
- ✅ Linha 274: `tenant_id: tenantId` (ledger rebuild)
- ✅ Linha 83: `created_by: user.id` ✓ (correto - campo diferente)

#### `src/hooks/usePDA.ts`
- ✅ Linha 35: `let tenantId = getActiveTenantId(activeOrg);`
- ✅ Linha 46: `tenantId = getActiveTenantId(activeOrg);`
- ✅ Linha 49: `tenantId = getActiveTenantId(activeOrg);`
- ✅ Linha 154: `tenant_id: tenantId` (insert data)
- ✅ Linha 228: `p_tenant_id: tenantId` (RPC call)

#### `src/hooks/useDashboardKpis.ts`
- ✅ Linha 41: `.eq("tenant_id", activeOrgId)` (PDAs)
- ✅ Linha 49: `.eq("tenant_id", activeOrgId)` (PDAs prev)
- ✅ Linha 57: `.eq("tenant_id", activeOrgId)` (FDAs)
- ✅ Linha 94: `.eq("tenant_id", activeOrgId)` (AR open)
- ✅ Linha 107: `.eq("tenant_id", activeOrgId)` (AP open)

#### `src/hooks/useRecentActivity.ts`
- ✅ Linha 26: `.eq("tenant_id", activeOrgId)` (PDAs)
- ✅ Linha 34: `.eq("tenant_id", activeOrgId)` (ledger)

### Pages (✅ Corretos)

#### `src/pages/FDANew.tsx`
- ✅ Linha 205: `tenant_id: activeOrg.id` (FDA creation)
- ✅ Linha 233: `tenant_id: activeOrg.id` (ledger lines)
- ✅ Linha 204: `created_by: user.id` ✓ (correto - campo diferente)

#### `src/pages/FDAList.tsx`
- ✅ Linha 81: `.eq("tenant_id", activeOrg.id)` (query filter)

#### `src/pages/PDAList.tsx`
- ✅ Linha 154: `.eq("tenant_id", activeOrg.id)` (query filter)

#### `src/pages/PublicPDAList.tsx`
- ✅ Linha 43: `.eq("tenant_id", activeOrg.id)` (query filter)

#### `src/pages/PublicPDAView.tsx`
- ✅ Linha 68: `.eq("tenant_id", activeOrg.id)` (validation)

#### `src/pages/FDALineDetail.tsx`
- ✅ Linha 253: `tenant_id: tenantId` (payment creation)

### Components (✅ Corretos)

#### `src/components/fda/FDALedgerTable.tsx`
- ✅ Linha 80: `tenant_id: activeOrg.id` (manual line)
- ✅ Linha 144: `tenant_id: activeOrg.id` (line update)

## Distinção Importante: `created_by` vs `tenant_id`

✅ **Uso correto identificado:**
- `created_by: user.id` - Rastreia qual usuário criou o registro (audit trail)
- `tenant_id: activeOrg.id` - Define qual organização possui o registro (multi-tenancy)

Estes são campos **diferentes** com propósitos **diferentes** e ambos estão sendo usados corretamente.

## Padrões Identificados

### Padrão 1: Uso do Helper (Recomendado)
```typescript
const tenantId = getActiveTenantId(activeOrg);
if (!tenantId) {
  throw new Error("Active organization required");
}
// Usar tenantId nas operações
```
**Usado em:** useFDA.ts, usePDA.ts

### Padrão 2: Uso Direto (Também Válido)
```typescript
tenant_id: activeOrg.id
```
**Usado em:** FDANew.tsx, FDALedgerTable.tsx, queries com .eq()

### Padrão 3: Queries com Filtro
```typescript
.eq("tenant_id", activeOrg.id)
```
**Usado em:** Todas as páginas de listagem e consulta

## Verificações de RLS

Todas as queries respeitam o RLS (Row Level Security) filtrando por `tenant_id`:
- ✅ PDAs só são visíveis/modificáveis pela org dona
- ✅ FDAs só são visíveis/modificáveis pela org dona
- ✅ FDA Ledger só é visível/modificável pela org dona

## Conclusão

**Status:** ✅ Código em perfeito estado

**Achados:**
- 0 usos incorretos de `user.id` como `tenant_id`
- 100% dos usos de `tenant_id` referenciam `activeOrg.id`
- Helper `getActiveTenantId()` já implementado e em uso
- Separação clara entre `created_by` (user) e `tenant_id` (org)

**Recomendações:**
- Nenhuma alteração necessária
- Padrão atual está correto e consistente
- Manter vigilância em código novo para seguir mesmos padrões

## Arquivos Auditados

1. src/hooks/useFDA.ts
2. src/hooks/usePDA.ts
3. src/hooks/useDashboardKpis.ts
4. src/hooks/useRecentActivity.ts
5. src/pages/FDANew.tsx
6. src/pages/FDAList.tsx
7. src/pages/PDAList.tsx
8. src/pages/PublicPDAList.tsx
9. src/pages/PublicPDAView.tsx
10. src/pages/FDALineDetail.tsx
11. src/components/fda/FDALedgerTable.tsx
12. src/lib/utils.ts

**Total de ocorrências de tenant_id analisadas:** 27  
**Total de ocorrências corretas:** 27 (100%)
