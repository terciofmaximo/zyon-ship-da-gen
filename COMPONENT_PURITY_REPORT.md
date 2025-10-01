# Component Purity Refactoring Report

**Data:** 2025-10-01  
**Objetivo:** Extrair chamadas diretas ao Supabase dos componentes React para hooks/serviços

## ✅ Service Hooks Criados

### 1. `src/hooks/useAuthService.ts` ✅
Hook para operações de autenticação:
- `signOut()` - Logout do usuário
- `signIn(email, password)` - Login
- `signUp(email, password, metadata)` - Cadastro
- `resetPassword(email)` - Reset de senha
- `updatePassword(newPassword)` - Atualizar senha
- Estado de loading
- Toast automático de erros

**Uso:**
```typescript
const { signOut, loading } = useAuthService();
// Em um componente:
<Button onClick={signOut} disabled={loading}>Logout</Button>
```

### 2. `src/hooks/useFDALedgerService.ts` ✅
Hook para operações no ledger FDA:
- `addLine(params)` - Adicionar nova linha
- `updateLineField(params)` - Atualizar campo de uma linha
- `deleteLine(lineId)` - Deletar linha
- `recalculateAmountsLocal(params)` - Recalcular valores locais
- `fetchLines(fdaId)` - Buscar todas as linhas
- Estado de loading
- Toast automático de erros/sucesso

**Uso:**
```typescript
const { addLine, updateLineField, loading } = useFDALedgerService();
// Em um componente:
const handleAdd = () => addLine({ fdaId, lineNo, side, tenantId });
```

### 3. `src/hooks/useTeamService.ts` ✅
Hook para gerenciamento de equipe:
- `fetchMembers(companyId)` - Buscar membros
- `fetchInvitations(companyId)` - Buscar convites
- `createInvitation(params)` - Criar convite
- `revokeInvitation(invitationId)` - Revogar convite
- `updateMemberRole(params)` - Atualizar role de membro
- `removeMember(memberId)` - Remover membro
- Tipos exportados: `TeamMember`, `TeamInvitation`, `MemberRole`, etc.
- Toast automático de erros/sucesso

**Uso:**
```typescript
const { fetchMembers, createInvitation, loading } = useTeamService();
// Em um componente:
useEffect(() => {
  fetchMembers(companyId).then(result => {
    if (result.success) setMembers(result.data);
  });
}, [companyId]);
```

## 📋 Componentes Identificados para Refatoração

### Componentes com Supabase Direto:

1. **src/components/fda/FDALedgerTable.tsx** 🔄
   - **Operações:** INSERT, UPDATE, DELETE em fda_ledger
   - **Hook a usar:** `useFDALedgerService`
   - **Status:** Hook criado, aguardando refatoração do componente

2. **src/components/layout/Header.tsx** 🔄
   - **Operação:** `supabase.auth.signOut()`
   - **Hook a usar:** `useAuthService`
   - **Status:** Hook criado, aguardando refatoração do componente

3. **src/components/organization/TeamManagement.tsx** 🔄
   - **Operações:** CRUD em memberships e invitations
   - **Hook a usar:** `useTeamService`
   - **Status:** Hook criado, aguardando refatoração do componente

4. **src/components/organization/CompanyManagement.tsx** ⏳
   - **Operações:** CRUD em organizations
   - **Ação:** Criar `useCompanyService` hook

5. **src/components/organization/DomainManagement.tsx** ⏳
   - **Operações:** CRUD em organization_domains
   - **Ação:** Criar `useDomainService` hook

6. **src/components/organization/InviteMemberDialog.tsx** ⏳
   - **Operações:** INSERT em invitations
   - **Ação:** Usar `useTeamService` (já criado)

### Context Providers (Aceitável ter Supabase):
- ✅ src/context/AuthProvider.tsx
- ✅ src/context/CompanyProvider.tsx
- ✅ src/context/OrgProvider.tsx

### Páginas (Container Components):
Páginas podem manter chamadas diretas ao Supabase, pois atuam como containers/smart components. No entanto, é recomendado usar hooks quando disponíveis.

## 🎯 Próximos Passos

### Fase 1: Refatorar Componentes com Hooks Criados ⏳

**1. Refatorar Header.tsx**
```typescript
// Antes:
const handleLogout = async () => {
  await supabase.auth.signOut();
  navigate("/auth");
};

// Depois:
const { signOut } = useAuthService();
<Button onClick={signOut}>Logout</Button>
```

**2. Refatorar FDALedgerTable.tsx**
```typescript
// Antes:
const handleAddLine = async () => {
  await supabase.from('fda_ledger').insert({...});
};

// Depois:
const { addLine } = useFDALedgerService();
const handleAddLine = () => addLine({ fdaId, lineNo, side, tenantId });
```

**3. Refatorar TeamManagement.tsx**
```typescript
// Antes:
const fetchMembers = async () => {
  const { data } = await supabase.from('memberships').select(...);
};

// Depois:
const { fetchMembers, loading } = useTeamService();
useEffect(() => {
  fetchMembers(companyId).then(result => setMembers(result.data));
}, [companyId]);
```

### Fase 2: Criar Hooks Adicionais ⏳

**4. Criar useCompanyService**
- CRUD operations em `organizations` table
- Para CompanyManagement.tsx

**5. Criar useDomainService**
- CRUD operations em `organization_domains` table
- Para DomainManagement.tsx

## 🔧 Padrão de Serviço

Todos os hooks de serviço seguem este padrão:

```typescript
export function useXXXService() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const operationName = useCallback(async (params) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('table')...;
      if (error) throw error;
      
      toast({ title: 'Success', description: '...' });
      return { success: true, data };
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: '...',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    operationName,
    loading,
  };
}
```

## 📊 Benefícios

1. **Separação de Responsabilidades**
   - Componentes focam em UI
   - Hooks encapsulam lógica de dados
   - Fácil testar isoladamente

2. **Reutilização**
   - Mesma operação usada em múltiplos componentes
   - DRY (Don't Repeat Yourself)
   - Manutenção centralizada

3. **Type Safety**
   - Tipos exportados pelos hooks
   - Autocomplete melhorado
   - Menos erros em tempo de desenvolvimento

4. **Error Handling**
   - Toast automático de erros
   - Padrão consistente de resposta
   - Loading states gerenciados

5. **Testabilidade**
   - Hooks podem ser testados com renderHook
   - Componentes mockam hooks facilmente
   - Testes unitários mais simples

## 🚨 DoD (Definition of Done)

- ✅ Hooks de serviço criados (auth, fda-ledger, team)
- ⏳ Componentes refatorados para usar hooks
- ⏳ Nenhuma importação direta de supabase/client em components/
- ⏳ Build passa sem erros
- ⏳ Funcionalidade mantida (sem breaking changes)

---

**Status Atual:** Fase de hooks completa, aguardando refatoração dos componentes. ✅
