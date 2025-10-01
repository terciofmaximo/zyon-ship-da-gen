# AI Context Comments Report

**Data:** 2025-10-01  
**Status:** ✅ Comentários estruturados adicionados

## Objetivo

Adicionar comentários estruturados (@ai-context, @ai-editable, @ai-guard) nos arquivos principais de PDA/FDA para orientar futuras edições pela IA, reduzindo retrabalho e quebras.

## Arquivos Modificados

### 1. src/hooks/useFDA.ts
**Bloco @ai-context adicionado:**
- Role: Hook para lógica de FDA (conversão PDA→FDA, gerenciamento de ledger, cálculos financeiros)
- DoD: Não alterar schema, usar tenant_id do activeOrg, incluir TODAS as linhas PDA (incluindo zeros)
- Constraints: Sincronizar rotas, preservar RLS, manter precisão financeira (Decimal.js)

**Áreas marcadas:**
- `@ai-editable:start(convertPdaToFda)` - linhas 31-164
- `@ai-guard:start/end` - tenant_id validation (linhas 65-69)
- `@ai-editable:start(rebuildFromPda)` - linhas 211-311
- `@ai-guard:start/end` - tenant_id validation (linhas 214-218)

### 2. src/hooks/usePDA.ts
**Bloco @ai-context adicionado:**
- Role: Hook para operações PDA (criação, updates, validação, rate limiting)
- DoD: Usar tenant_id do activeOrg, preservar RLS e rate limits, suportar modo público e autenticado
- Constraints: Sincronizar validações com schemas, preservar retry logic

**Áreas marcadas:**
- `@ai-editable:start(savePDA)` - linhas 25-302
- `@ai-guard:start/end` - tenant_id e auth logic (linhas 32-74)

### 3. src/pages/FDADetail.tsx
**Bloco @ai-context adicionado:**
- Role: Página de detalhe/edição de FDA
- DoD: Preservar concurrency checks, Save draft sempre habilitado, recalcular FX quando muda
- Constraints: Não desabilitar "Save Draft" com validação, manter shortcut Ctrl/Cmd+S

**Áreas marcadas:**
- `@ai-editable:start(handleSaveDraft)` - linhas 144-241
- `@ai-guard:start/end` - concurrency check (linhas 157-178)

### 4. src/pages/FDAList.tsx
**Bloco @ai-context adicionado:**
- Role: Lista de FDAs com filtros, sorting e ações rápidas
- DoD: Filtrar por activeOrg.id (exceto platformAdmin), calcular totais (AP/AR/Net)
- Constraints: Manter RLS policy, formatting consistente USD/BRL

**Áreas marcadas:**
- `@ai-editable:start(fetchFDAs)` - linhas 69-148
- `@ai-guard:start/end` - RLS tenant filter (linhas 78-82)

### 5. src/pages/PDAList.tsx
**Bloco @ai-context adicionado:**
- Role: Lista de PDAs com filtros, sorting, paginação e status management
- DoD: Filtrar por activeOrg.id, preservar highlighting de novas PDAs, suportar PDA→FDA
- Constraints: Manter RLS, preservar paginação, mapping de status (statusLabels/Variants)

### 6. src/pages/PDAReview.tsx
**Bloco @ai-context adicionado:**
- Role: Página de detalhe/review de PDA com ações (send, approve, convert to FDA)
- DoD: Exibir todos os 13 cost items, suportar PDF generation, transições de status válidas
- Constraints: Manter fluxo de status (CREATED → SENT → APPROVED → FDA), sincronizar cost items

### 7. src/components/fda/FDALedgerTable.tsx
**Bloco @ai-context adicionado:**
- Role: Tabela editável de ledger FDA com inline editing, date pickers, sorting, filtros AP/AR
- DoD: Exibir TODAS as linhas (incluindo zeros), usar activeOrg.id para novas linhas, debounced save
- Constraints: Recalcular amount_local quando FX muda, manter Portal para date picker (z-index)

**Áreas marcadas:**
- `@ai-editable:start(handleAddLine)` - linhas 52-104
- `@ai-guard:start/end` - tenant_id validation (linhas 67-84)

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
// ... código editável
// @ai-editable:end
```

### @ai-guard (áreas críticas)
```typescript
// @ai-guard:start - descrição do que protege
// ... código crítico (tenant_id, RLS, validações)
// @ai-guard:end
```

## Benefícios Esperados

1. **Redução de Retrabalho:** IA entende contexto e restrições de cada arquivo
2. **Menos Quebras:** Áreas críticas (RLS, tenant_id) claramente marcadas
3. **Edições Mais Precisas:** @ai-editable delimita escopo de mudanças
4. **Manutenibilidade:** DoD e Constraints documentam regras de negócio
5. **Onboarding Mais Rápido:** Novos devs (humanos ou IA) entendem arquitetura

## Próximos Passos Recomendados

- [ ] Adicionar @ai-context em services (se houver)
- [ ] Documentar fluxo completo PDA→FDA no README
- [ ] Criar guia de convenções para @ai-editable/@ai-guard
- [ ] Estender comentários para componentes de forms (NewPDAWizard, etc.)

---

**Build:** ✅ OK (somente comentários, sem mudança de lógica)  
**TypeCheck:** ✅ OK
