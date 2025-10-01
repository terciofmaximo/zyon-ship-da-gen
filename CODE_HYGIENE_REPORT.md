# Relatório de Higiene de Código

**Data:** 2025-10-01  
**Tipo:** Análise (sem alterações)

---

## 📊 Sumário Executivo

| Categoria | Ocorrências | Severidade | Status |
|-----------|-------------|------------|--------|
| TODO/FIXME/BUG | 1 | 🟡 Baixa | Funcionalidade pendente |
| Chamadas Supabase diretas em componentes | 0 | ✅ OK | Todos refatorados |
| Uso de `any` | 57 em 31 arquivos | 🟠 Média | Precisa type safety |
| Imports relativos profundos | 0 | ✅ OK | Todos usando aliases |
| Async sem tratamento de erro | 2 | 🔴 Alta | Risco de crashes |

---

## 1. TODO/FIXME/BUG Comments

### ✅ Status: 1 ocorrência encontrada

#### `src/components/organization/TeamManagement.tsx` (linha 522)
```typescript
// TODO: Implement remove member functionality
toast({
  title: "Feature Coming Soon",
  description: "Member removal functionality will be implemented soon",
});
```

**Sugestão:** 
- Implementar funcionalidade `removeMember` no hook `useTeamService`
- Adicionar RLS policy para permitir owner/admin remover membros
- Atualizar UI para chamar a função real

---

## 2. Chamadas Supabase Diretas em Componentes

### ✅ Status: 0 ocorrências (EXCELENTE!)

Todos os componentes foram refatorados com sucesso para usar service hooks:
- ✅ `Header.tsx` → usa `useAuthService()`
- ✅ `FDALedgerTable.tsx` → usa `useFDALedgerService()`
- ✅ `TeamManagement.tsx` → usa `useTeamService()`

**Conclusão:** Componentes estão puros e seguem o padrão estabelecido.

---

## 3. Uso de `any` Implícito/Explícito

### 🟠 Status: 57 ocorrências em 31 arquivos (PRECISA ATENÇÃO)

#### Alta Prioridade (Handlers e Callbacks)

**`src/components/fda/FDALedgerTable.tsx`** (3 ocorrências)
```typescript
// Linha 97
const saveLineChange = useCallback(async (lineId: string, field: string, value: any) => {

// Linha 135  
const debouncedSave = useCallback((lineId: string, field: string, value: any) => {

// Linha 169
const handleCellEdit = (lineId: string, field: string, value: any) => {
```

**Sugestão:**
```typescript
type CellValue = string | number | null;
const saveLineChange = useCallback(async (
  lineId: string, 
  field: keyof FDALedgerLine, 
  value: CellValue
) => {
```

---

**`src/pages/FDANew.tsx`** (linha 112)
```typescript
const updateLedgerLine = (id: string, field: string, value: any) => {
```

**Sugestão:**
```typescript
const updateLedgerLine = (
  id: string, 
  field: keyof FDALedgerLine, 
  value: string | number
) => {
```

---

#### Média Prioridade (Error Handling)

**31 arquivos com `catch (error: any)`:**
- `src/components/organization/CompanyManagement.tsx` (6x)
- `src/components/organization/InviteMemberDialog.tsx` (1x)
- `src/components/organization/TeamManagement.tsx` (3x)
- `src/hooks/usePDA.ts` (1x)
- `src/hooks/useResetAdminPassword.ts` (1x)
- `src/hooks/useSeedPlatformAdmin.ts` (1x)
- `src/hooks/useTeamService.ts` (1x)
- `src/hooks/useTenantResolver.ts` (1x)
- `src/pages/AcceptInvite.tsx` (2x)
- `src/pages/Auth.tsx` (1x)
- `src/pages/EmailConfirmed.tsx` (1x)
- `src/pages/FDALineDetail.tsx` (4x)
- `src/pages/ForgotPassword.tsx` (1x)
- `src/pages/InviteAccept.tsx` (2x)
- `src/pages/OrganizationSettings.tsx` (3x)
- `src/pages/PublicPDAList.tsx` (1x)
- `src/pages/PublicPDAView.tsx` (2x)
- `src/pages/ResetPassword.tsx` (1x)
- `src/pages/SeedAdmin.tsx` (1x)
- `src/pages/Signup.tsx` (1x)

**Sugestão:**
```typescript
// Criar tipo genérico de erro
type AppError = Error & { 
  message: string;
  code?: string;
};

// Usar em catches
try {
  // ...
} catch (error) {
  const err = error as AppError;
  console.error(err.message);
}
```

---

#### Baixa Prioridade (Metadata e Props genéricos)

**`src/types/fda.ts`**
```typescript
meta?: any;        // linha 17
source?: any;      // linha 39
```

**Sugestão:**
```typescript
interface FDAMeta {
  fx_source?: string;
  received_from_client_usd?: number;
  [key: string]: unknown;
}

interface FDASource {
  pdaField?: string;
  originalAmount?: number;
  exchangeRate?: number;
}
```

---

**`src/pages/PDAReview.tsx`** (linha 70)
```typescript
comments: any;
```

**Sugestão:**
```typescript
interface PDAComments {
  general?: string;
  costs?: string;
  [field: string]: string | undefined;
}
```

---

#### Utilitários (Aceitável)

**`src/components/forms/CostEntryForm.tsx`** (linha 452)
```typescript
function debounce<T extends (...args: any[]) => any>(
```

**`src/utils/pdaValidationUtils.ts`** (linha 76)
```typescript
export function debounce<T extends (...args: any[]) => any>(
```

**Status:** ✅ OK - Uso genérico correto para utility functions

---

## 4. Imports Relativos Profundos

### ✅ Status: 0 ocorrências (EXCELENTE!)

Todos os imports usam aliases configurados:
- ✅ `@/components/*`
- ✅ `@/hooks/*`
- ✅ `@/lib/*`
- ✅ `@/types/*`
- ✅ `@/integrations/*`

**Conclusão:** Estrutura de imports está correta e mantível.

---

## 5. Operações Async sem Tratamento de Erro

### 🔴 Status: 2 casos críticos encontrados

#### Caso 1: `src/pages/Index.tsx` (linhas 24-38)

```typescript
const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast({
      title: "Erro",
      description: "Falha ao fazer logout",
      variant: "destructive"
    });
  } else {
    toast({
      title: "Logout",
      description: "Sessão encerrada com sucesso"
    });
  }
};
```

**Problema:** Sem `try/catch` - se `signOut()` lançar exceção (ex.: rede), o app crasha.

**Sugestão:**
```typescript
const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    toast({
      title: "Logout",
      description: "Sessão encerrada com sucesso"
    });
  } catch (error) {
    console.error("Logout error:", error);
    toast({
      title: "Erro",
      description: "Falha ao fazer logout",
      variant: "destructive"
    });
  }
};
```

---

#### Caso 2: `src/pages/NoOrganization.tsx` (linhas 60-72)

```typescript
const handleRequestAccess = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  toast({
    title: "Request access",
    description: `Please contact your administrator with your email: ${user?.email}`,
  });
};

const handleLogout = async () => {
  await supabase.auth.signOut();
  navigate("/auth");
};
```

**Problemas:**
1. `handleRequestAccess` - sem `try/catch`, pode crashar
2. `handleLogout` - sem `try/catch`, pode crashar

**Sugestão:**
```typescript
const handleRequestAccess = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    toast({
      title: "Request access",
      description: `Please contact your administrator with your email: ${user?.email}`,
    });
  } catch (error) {
    console.error("Get user error:", error);
    toast({
      title: "Error",
      description: "Failed to retrieve user information",
      variant: "destructive"
    });
  }
};

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/auth");
  } catch (error) {
    console.error("Logout error:", error);
    // Navigate anyway to prevent user getting stuck
    navigate("/auth");
  }
};
```

---

## 📋 Plano de Ação Recomendado

### Prioridade 1 (Crítico - Risco de Crash)
1. ✅ **Adicionar try/catch em async handlers**
   - `src/pages/Index.tsx` → handleLogout
   - `src/pages/NoOrganization.tsx` → handleRequestAccess, handleLogout
   - **Impacto:** Previne crashes em operações de auth

### Prioridade 2 (Importante - Type Safety)
2. 🟠 **Tipar handlers de edição**
   - `src/components/fda/FDALedgerTable.tsx` → saveLineChange, handleCellEdit
   - `src/pages/FDANew.tsx` → updateLedgerLine
   - **Impacto:** Previne bugs de type mismatch

3. 🟠 **Tipar metadata e source**
   - `src/types/fda.ts` → FDAMeta interface, FDASource interface
   - **Impacto:** Melhora autocomplete e type checking

### Prioridade 3 (Manutenção - Tech Debt)
4. 🟡 **Implementar feature pendente**
   - `src/components/organization/TeamManagement.tsx` → remove member
   - **Impacto:** Completar funcionalidade

5. 🟡 **Padronizar error handling**
   - Criar tipo `AppError` genérico
   - Substituir `catch (error: any)` por `catch (error)`
   - **Impacto:** Melhor tracking de erros

---

## 🎯 Métricas de Qualidade

| Métrica | Valor | Meta | Status |
|---------|-------|------|--------|
| Chamadas Supabase diretas | 0 | 0 | ✅ Atingida |
| Imports relativos profundos | 0 | 0 | ✅ Atingida |
| Async handlers sem try/catch | 2 | 0 | 🔴 Crítico |
| TODOs pendentes | 1 | <5 | ✅ OK |
| Type safety (`any`) | 57 | <20 | 🟠 Precisa melhorar |

---

## Conclusão

**Pontos Fortes:**
- ✅ Componentes puros (service hooks implementados)
- ✅ Estrutura de imports limpa (aliases)
- ✅ Baixo número de TODOs

**Pontos de Atenção:**
- 🔴 2 handlers críticos sem tratamento de erro
- 🟠 57 usos de `any` comprometem type safety
- 🟡 1 feature pendente de implementação

**Recomendação:** Priorizar correção dos handlers async (Prioridade 1) antes de novas features.
