# AI Context Comments Report

**Data:** 2025-10-01  
**Status:** ✅ Comentários estruturados adicionados (8 arquivos)

## Objetivo

Adicionar comentários estruturados (@ai-context, @ai-editable, @ai-guard) nos arquivos principais de PDA/FDA para orientar futuras edições pela IA, reduzindo retrabalho e quebras.

## Arquivos Modificados

### 1. src/hooks/useFDA.ts ✅
**Bloco @ai-context:**
- Role: Hook para lógica de FDA (conversão PDA→FDA, gerenciamento de ledger, cálculos financeiros)
- DoD: Não alterar schema, usar tenant_id do activeOrg, incluir TODAS as linhas PDA (incluindo zeros)
- Constraints: Sincronizar rotas, preservar RLS, manter precisão financeira (Decimal.js)

**Áreas delimitadas:**
- `@ai-editable:start(convertPdaToFda)` - conversão PDA→FDA
- `@ai-guard` - validação tenant_id (linhas 81-87, 235-241)
- `@ai-editable:start(rebuildFromPda)` - reconstrução de ledger

### 2. src/hooks/usePDA.ts ✅
**Bloco @ai-context:**
- Role: Hook para operações PDA (criação, updates, validação, rate limiting)
- DoD: Usar tenant_id do activeOrg, preservar RLS e rate limits, suportar modo público e autenticado
- Constraints: Sincronizar validações com schemas, preservar retry logic

**Áreas delimitadas:**
- `@ai-editable:start(savePDA)` - lógica principal de salvamento
- `@ai-guard` - tenant_id e auth logic (linhas 49-67)

### 3. src/pages/FDADetail.tsx ✅
**Bloco @ai-context:**
- Role: Página de detalhe/edição de FDA
- DoD: Preservar concurrency checks, Save draft sempre habilitado, recalcular FX quando muda
- Constraints: Não desabilitar "Save Draft" com validação, manter shortcut Ctrl/Cmd+S

**Áreas delimitadas:**
- `@ai-editable:start` - handleSaveDraft (linha 193-259)

### 4. src/pages/FDAList.tsx ✅
**Bloco @ai-context:**
- Role: Lista de FDAs com filtros, sorting e ações rápidas
- DoD: Filtrar por activeOrg.id (exceto platformAdmin), calcular totais (AP/AR/Net)
- Constraints: Manter RLS policy, formatting consistente USD/BRL

**Áreas delimitadas:**
- `@ai-guard` - RLS tenant filter (linhas 92-98)

### 5. src/pages/PDAList.tsx ✅
**Bloco @ai-context:**
- Role: Lista de PDAs com filtros, sorting, paginação e status management
- DoD: Filtrar por activeOrg.id, preservar highlighting de novas PDAs, suportar PDA→FDA
- Constraints: Manter RLS, preservar paginação, mapping de status

### 6. src/pages/PDAReview.tsx ✅
**Bloco @ai-context:**
- Role: Página de detalhe/review de PDA com ações (send, approve, convert to FDA)
- DoD: Exibir todos os 13 cost items, suportar PDF generation, transições de status válidas
- Constraints: Manter fluxo de status (CREATED → SENT → APPROVED → FDA)

### 7. src/components/fda/FDALedgerTable.tsx ✅
**Bloco @ai-context:**
- Role: Tabela editável de ledger FDA com inline editing, date pickers, sorting, filtros AP/AR
- DoD: Exibir TODAS as linhas (incluindo zeros), usar activeOrg.id para novas linhas, debounced save
- Constraints: Recalcular amount_local quando FX muda, manter Portal para date picker

### 8. src/pages/FDANew.tsx ✅ (Adicionado nesta iteração)
**Bloco @ai-context:**
- Role: Criação direta de FDA com entrada manual de ledger (sem PDA existente)
- DoD: Criar PDA primeiro (FDA requer pda_id), depois FDA, depois ledger entries
- Constraints: Manter fluxo de 3 etapas, usar Decimal.js, preservar exchange rate logic

## Padrões Utilizados

### @ai-context (topo do arquivo)
```typescript
/*
 * @ai-context
 * Role: <resumo do arquivo>
 * DoD:
 * - Não alterar schema do banco.
 * - Usar tenant_id da organização ativa (getActiveTenantId()).
 * - Manter acessibilidade e i18n.
 * Constraints:
 * - Se alterar rotas, sincronizar com o mapa de rotas.
 * - Não remover verificações de RLS/permissão.
 */
```

### @ai-editable (áreas editáveis)
```typescript
// @ai-editable:start(functionName)
// ... código editável com cuidado
// @ai-editable:end
```

### @ai-guard (áreas críticas)
```typescript
// @ai-guard:start - descrição do que protege
// ... código crítico (tenant_id, RLS, validações)
// @ai-guard:end
```

## Cobertura

| Tipo | Arquivos | Status |
|------|----------|--------|
| Hooks | 2 | ✅ useFDA.ts, usePDA.ts |
| Pages | 5 | ✅ FDADetail, FDAList, FDANew, PDAList, PDAReview |
| Components | 1 | ✅ FDALedgerTable |
| **Total** | **8** | **100% dos arquivos principais** |

## Temas Protegidos

1. **Tenant ID Management**
   - Sempre usar `getActiveTenantId(activeOrg)`
   - Nunca usar `user.id` como tenant_id
   - Marcado com `@ai-guard` nos hooks

2. **RLS Policy Enforcement**
   - Usuários regulares veem apenas sua org
   - platformAdmin vê todas orgs
   - Filtros sempre com tenant_id
   - Marcado com `@ai-guard` em queries

3. **Precisão Financeira**
   - Usar Decimal.js para cálculos
   - Preservar lógica de exchange rate
   - Não usar aritmética JS direta

4. **Integridade de Dados**
   - Incluir TODOS os cost items (incluindo zeros)
   - Manter audit trail (created_by, updated_at)
   - Preservar concurrency checks

5. **Fluxo de Status**
   - PDA: CREATED → SENT → APPROVED
   - FDA: Draft → Posted → Settled
   - Nunca pular validações

## Benefícios

1. **Redução de Quebras:** IA sabe o que não tocar
2. **Onboarding Rápido:** Novos devs entendem áreas críticas
3. **Consistência:** Padrões uniformes entre arquivos
4. **Segurança:** Guards protegem auth, RLS, tenant_id
5. **Manutenibilidade:** Limites claros de edição

## Mudanças Nesta Iteração

- ✅ Adicionado `@ai-context` no src/pages/FDANew.tsx
- ✅ Verificado que outros 7 arquivos já tinham anotações completas
- ✅ Relatório atualizado com cobertura completa

---

**Build:** ✅ OK (somente comentários, sem mudança de lógica)  
**TypeCheck:** ✅ OK  
**Total de linhas de orientação:** ~150 (puro comentário)
