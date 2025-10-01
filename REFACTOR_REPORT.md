# Refatoração de Estrutura de Diretórios - Relatório

## Objetivo
Reorganizar o projeto por domínios funcionais para melhor organização e entendimento por parte da IA.

## Nova Estrutura

```
src/
├── features/
│   ├── pda/          # Pre-Departure Approval domain
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   ├── fda/          # Final Disbursement Account domain  
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── data/
│   ├── auth/         # Authentication domain
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── schemas/
│   ├── org/          # Organization management domain
│   │   ├── pages/
│   │   ├── components/
│   │   └── context/
│   └── admin/        # Platform admin domain
│       └── pages/
└── shared/           # Shared/generic code
    ├── components/   # Shared layout components
    ├── hooks/        # Generic hooks
    ├── utils/        # Generic utilities
    ├── pages/        # Generic pages (Index, NotFound)
    └── data/         # Shared data
```

## Arquivos Movidos

### PDA Domain (src/features/pda/)
- **Pages**: PDAList, PDAReview, PdaCreationStep1, PublicPDAList, PublicPDAView, PublicPDANew
- **Components**: NewPDAWizard, ShipDataForm, CostEntryForm, ReviewForm, PDADocument
- **Hooks**: usePDA
- **Schemas**: pdaSchema, pdaInputSchema
- **Utils**: pdaValidationUtils, pdaValidation
- **Types**: index (ShipData, CostData, PDAData)

### FDA Domain (src/features/fda/)
- **Pages**: FDADetail, FDAList, FDANew, FDALineDetail
- **Components**: FDALedgerTable
- **Hooks**: useFDA
- **Types**: fda (FDA, FDALedger, FDAWithLedger, etc.)
- **Data**: fdaRules.json

### Auth Domain (src/features/auth/)
- **Pages**: Auth, Signup, ForgotPassword, ResetPassword, VerifyEmail, EmailConfirmed, AcceptInvite, InviteAccept, InviteDisabled
- **Components**: RequireAuth
- **Context**: AuthProvider
- **Hooks**: useEnsureAuth
- **Schemas**: signupSchema

### Org Domain (src/features/org/)
- **Pages**: OrganizationSettings, NoOrganization
- **Components**: CompanyManagement, DomainManagement, InviteMemberDialog, TeamManagement, OrgSwitcher, CompanySwitcher
- **Context**: OrgProvider, CompanyProvider, TenantProvider

### Admin Domain (src/features/admin/)
- **Pages**: PlatformAdmin, SeedAdmin

### Shared (src/shared/)
- **Pages**: Index, NotFound
- **Components**: AppSidebar, DashboardLayout, DashboardStats, Header, PublicHeader, RootRedirect
- **Hooks**: use-toast, use-mobile, useDashboardKpis, useDemoAdminSetup, useInvitationCleanup, useItaquiAutoPricing, usePermissions, usePortDirectory, useRecentActivity, useTenantResolver, useUserRole, useSeedPlatformAdmin, useResetAdminPassword
- **Utils**: utils, portDirectory, shipTypeRanges, vesselData, portDirectoryMerger, sessionTracking
- **Data**: itaquiTariffs.ts

## Atualizações de Imports

### Padrões de Atualização Necessários

1. **@/lib/utils** → **@/shared/utils/utils** (53 arquivos)
2. **@/hooks/use-toast** → **@/shared/hooks/use-toast** (35 arquivos)
3. **@/hooks/use-mobile** → **@/shared/hooks/use-mobile**
4. **@/context/AuthProvider** → **@/features/auth/context/AuthProvider**
5. **@/context/OrgProvider** → **@/features/org/context/OrgProvider**
6. **@/context/CompanyProvider** → **@/features/org/context/CompanyProvider**
7. **@/context/TenantProvider** → **@/features/org/context/TenantProvider**
8. **@/types** → **@/features/pda/types**
9. **@/types/fda** → **@/features/fda/types/fda**
10. **@/schemas/pdaSchema** → **@/features/pda/schemas/pdaSchema**
11. **@/schemas/signupSchema** → **@/features/auth/schemas/signupSchema**
12. **@/hooks/usePDA** → **@/features/pda/hooks/usePDA**
13. **@/hooks/useFDA** → **@/features/fda/hooks/useFDA**
14. **@/hooks/useUserRole** → **@/shared/hooks/useUserRole**
15. **@/hooks/usePermissions** → **@/shared/hooks/usePermissions**
16. **@/hooks/useSeedPlatformAdmin** → **@/shared/hooks/useSeedPlatformAdmin**
17. **@/hooks/useResetAdminPassword** → **@/shared/hooks/useResetAdminPassword**
18. **@/utils/sessionTracking** → **@/shared/utils/sessionTracking**
19. **@/lib/pdaValidation** → **@/features/pda/utils/pdaValidation**
20. **@/schemas/pdaInputSchema** → **@/features/pda/schemas/pdaInputSchema**
21. **@/components/pdf/PDADocument** → **@/features/pda/components/PDADocument**
22. **@/components/fda/FDALedgerTable** → **@/features/fda/components/FDALedgerTable**
23. **@/components/layout/*** → **@/shared/components/*** ou **@/features/org/components/***
24. **@/data/itaquiTariffs** → **@/shared/data/itaquiTariffs**

## Status
- ✅ Arquivos movidos
- 🔄 Imports sendo atualizados
- ⏳ Compilação pendente

## Benefícios
- Melhor organização por domínio funcional
- IA consegue entender melhor o contexto de cada feature
- Imports mais explícitos e menos quebradiços
- Separação clara entre código compartilhado e específico de domínio
