import { Routes, Route } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Toaster } from '@/components/ui/toaster'
import { DashboardPage } from '@/pages/dashboard-page'
import { PDAPage } from '@/pages/pda-page'

function App() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pda" element={<PDAPage />} />
            <Route path="/schedules" element={<div className="p-6">Cronogramas - Em desenvolvimento</div>} />
            <Route path="/fda" element={<div className="p-6">FDA - Em desenvolvimento</div>} />
            <Route path="/financial" element={<div className="p-6">Financeiro - Em desenvolvimento</div>} />
            <Route path="/billing" element={<div className="p-6">Faturamento - Em desenvolvimento</div>} />
            <Route path="/reports" element={<div className="p-6">Relatórios - Em desenvolvimento</div>} />
            <Route path="/clients" element={<div className="p-6">Clientes - Em desenvolvimento</div>} />
            <Route path="/settings" element={<div className="p-6">Configurações - Em desenvolvimento</div>} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}

export default App