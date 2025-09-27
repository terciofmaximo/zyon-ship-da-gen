import { NewPDAWizard } from '@/components/forms/new-pda-wizard'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function PDAPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerador de PDA</h1>
          <p className="text-muted-foreground">
            Crie e gerencie documentos de Pre-Departure Assessment
          </p>
        </div>
      </div>

      <NewPDAWizard />
    </div>
  )
}