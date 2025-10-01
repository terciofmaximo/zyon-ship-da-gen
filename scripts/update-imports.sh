#!/bin/bash
# Script para atualizar todos os imports após refatoração

# Atualizar @/lib/utils para @/shared/utils/utils
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/lib/utils["'"'"']|from "@/shared/utils/utils"|g' {} \;

# Atualizar @/hooks/use-toast para @/shared/hooks/use-toast
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/hooks/use-toast["'"'"']|from "@/shared/hooks/use-toast"|g' {} \;

# Atualizar @/hooks/use-mobile para @/shared/hooks/use-mobile
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/hooks/use-mobile["'"'"']|from "@/shared/hooks/use-mobile"|g' {} \;

# Atualizar @/context/AuthProvider para @/features/auth/context/AuthProvider
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/context/AuthProvider["'"'"']|from "@/features/auth/context/AuthProvider"|g' {} \;

# Atualizar @/context/OrgProvider para @/features/org/context/OrgProvider
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/context/OrgProvider["'"'"']|from "@/features/org/context/OrgProvider"|g' {} \;

# Atualizar @/context/CompanyProvider para @/features/org/context/CompanyProvider
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/context/CompanyProvider["'"'"']|from "@/features/org/context/CompanyProvider"|g' {} \;

# Atualizar @/context/TenantProvider para @/features/org/context/TenantProvider
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/context/TenantProvider["'"'"']|from "@/features/org/context/TenantProvider"|g' {} \;

# Atualizar @/types para @/features/pda/types
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/types["'"'"']|from "@/features/pda/types"|g' {} \;

# Atualizar @/types/fda para @/features/fda/types/fda
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/types/fda["'"'"']|from "@/features/fda/types/fda"|g' {} \;

# Atualizar @/schemas/pdaSchema para @/features/pda/schemas/pdaSchema
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/schemas/pdaSchema["'"'"']|from "@/features/pda/schemas/pdaSchema"|g' {} \;

# Atualizar @/schemas/signupSchema para @/features/auth/schemas/signupSchema
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/schemas/signupSchema["'"'"']|from "@/features/auth/schemas/signupSchema"|g' {} \;

# Atualizar @/hooks/usePDA para @/features/pda/hooks/usePDA
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/hooks/usePDA["'"'"']|from "@/features/pda/hooks/usePDA"|g' {} \;

# Atualizar @/hooks/useFDA para @/features/fda/hooks/useFDA
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/hooks/useFDA["'"'"']|from "@/features/fda/hooks/useFDA"|g' {} \;

# Atualizar @/hooks/useUserRole para @/shared/hooks/useUserRole
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/hooks/useUserRole["'"'"']|from "@/shared/hooks/useUserRole"|g' {} \;

# Atualizar @/hooks/usePermissions para @/shared/hooks/usePermissions
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/hooks/usePermissions["'"'"']|from "@/shared/hooks/usePermissions"|g' {} \;

# Atualizar @/hooks/useSeedPlatformAdmin para @/shared/hooks/useSeedPlatformAdmin
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/hooks/useSeedPlatformAdmin["'"'"']|from "@/shared/hooks/useSeedPlatformAdmin"|g' {} \;

# Atualizar @/hooks/useResetAdminPassword para @/shared/hooks/useResetAdminPassword
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/hooks/useResetAdminPassword["'"'"']|from "@/shared/hooks/useResetAdminPassword"|g' {} \;

# Atualizar @/utils/sessionTracking para @/shared/utils/sessionTracking
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/utils/sessionTracking["'"'"']|from "@/shared/utils/sessionTracking"|g' {} \;

# Atualizar @/lib/pdaValidation para @/features/pda/utils/pdaValidation
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/lib/pdaValidation["'"'"']|from "@/features/pda/utils/pdaValidation"|g' {} \;

# Atualizar @/schemas/pdaInputSchema para @/features/pda/schemas/pdaInputSchema
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/schemas/pdaInputSchema["'"'"']|from "@/features/pda/schemas/pdaInputSchema"|g' {} \;

# Atualizar @/components/pdf/PDADocument para @/features/pda/components/PDADocument
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/components/pdf/PDADocument["'"'"']|from "@/features/pda/components/PDADocument"|g' {} \;

# Atualizar @/components/fda/FDALedgerTable para @/features/fda/components/FDALedgerTable
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/components/fda/FDALedgerTable["'"'"']|from "@/features/fda/components/FDALedgerTable"|g' {} \;

# Atualizar @/data/itaquiTariffs para @/shared/data/itaquiTariffs
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from ["'"'"']@/data/itaquiTariffs["'"'"']|from "@/shared/data/itaquiTariffs"|g' {} \;

echo "Imports atualizados com sucesso!"
