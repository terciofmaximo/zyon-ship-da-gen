# Instruções de Atualização Manual de Imports

Devido ao grande volume de arquivos, o usuário precisará executar o script de shell `scripts/update-imports.sh` manualmente em um ambiente local com Git Bash ou terminal Unix.

## Alternativa: Atualização manual via VSCode

Se preferir, use o recurso Find & Replace (Ctrl/Cmd+Shift+H) do VSCode com essas substituições em ordem:

### 1. Utils
- Buscar: `from "@/lib/utils"`
- Substituir: `from "@/shared/utils/utils"`

### 2. Hooks - use-toast
- Buscar: `from "@/hooks/use-toast"`
- Substituir: `from "@/shared/hooks/use-toast"`

### 3. Hooks - use-mobile
- Buscar: `from "@/hooks/use-mobile"`
- Substituir: `from "@/shared/hooks/use-mobile"`

### 4. Context - AuthProvider
- Buscar: `from "@/context/AuthProvider"`
- Substituir: `from "@/features/auth/context/AuthProvider"`

### 5. Context - OrgProvider
- Buscar: `from "@/context/OrgProvider"`
- Substituir: `from "@/features/org/context/OrgProvider"`

### 6. Context - CompanyProvider
- Buscar: `from "@/context/CompanyProvider"`
- Substituir: `from "@/features/org/context/CompanyProvider"`

### 7. Context - TenantProvider
- Buscar: `from "@/context/TenantProvider"`
- Substituir: `from "@/features/org/context/TenantProvider"`

### 8. Types - PDA
- Buscar: `from "@/types"`
- Substituir: `from "@/features/pda/types"`

### 9. Types - FDA
- Buscar: `from "@/types/fda"`
- Substituir: `from "@/features/fda/types/fda"`

### 10. Schemas - PDA
- Buscar: `from "@/schemas/pdaSchema"`
- Substituir: `from "@/features/pda/schemas/pdaSchema"`

- Buscar: `from "@/schemas/pdaInputSchema"`
- Substituir: `from "@/features/pda/schemas/pdaInputSchema"`

### 11. Schemas - Signup
- Buscar: `from "@/schemas/signupSchema"`
- Substituir: `from "@/features/auth/schemas/signupSchema"`

### 12. Hooks - Domain-specific
- Buscar: `from "@/hooks/usePDA"`
- Substituir: `from "@/features/pda/hooks/usePDA"`

- Buscar: `from "@/hooks/useFDA"`
- Substituir: `from "@/features/fda/hooks/useFDA"`

### 13. Hooks - Shared
- Buscar: `from "@/hooks/useUserRole"`
- Substituir: `from "@/shared/hooks/useUserRole"`

- Buscar: `from "@/hooks/usePermissions"`
- Substituir: `from "@/shared/hooks/usePermissions"`

- Buscar: `from "@/hooks/useSeedPlatformAdmin"`
- Substituir: `from "@/shared/hooks/useSeedPlatformAdmin"`

- Buscar: `from "@/hooks/useResetAdminPassword"`
- Substituir: `from "@/shared/hooks/useResetAdminPassword"`

### 14. Utils - Domain-specific
- Buscar: `from "@/utils/sessionTracking"`
- Substituir: `from "@/shared/utils/sessionTracking"`

- Buscar: `from "@/lib/pdaValidation"`
- Substituir: `from "@/features/pda/utils/pdaValidation"`

### 15. Components - Domain-specific
- Buscar: `from "@/components/pdf/PDADocument"`
- Substituir: `from "@/features/pda/components/PDADocument"`

- Buscar: `from "@/components/fda/FDALedgerTable"`
- Substituir: `from "@/features/fda/components/FDALedgerTable"`

### 16. Data
- Buscar: `from "@/data/itaquiTariffs"`
- Substituir: `from "@/shared/data/itaquiTariffs"`

### 17. Layout Components (verificar imports relativos dentro de features/org e shared)
- Buscar: `from "./OrgSwitcher"`  (em Header.tsx)
- Substituir: `from "@/features/org/components/OrgSwitcher"`

- Buscar: `from "./CompanySwitcher"` (em Header.tsx)
- Substituir: `from "@/features/org/components/CompanySwitcher"`

### 18. Imports relativos quebrados em features
Verificar arquivos em `src/features/**` que ainda usam imports relativos como:
- `../../pages/PdaCreationStep1` → usar path absoluto com @/features/...
- `./AuthProvider` → usar path absoluto com @/features/...

## Após fazer as substituições

1. Executar `npm run typecheck` para verificar erros restantes
2. Corrigir manualmente quaisquer imports relativos quebrados
3. Testar a aplicação

## Problemas conhecidos

Os arquivos em `src/features/org/context/` podem ainda importar entre si usando caminhos relativos como `./AuthProvider`. Estes precisam ser atualizados para `@/features/auth/context/AuthProvider`.
