import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PDAList from "./pages/PDAList";
import PDAReview from "./pages/PDAReview";
import { NewPDAWizard } from "@/components/forms/NewPDAWizard";
import AuthPage from "@/pages/Auth";
import FDAList from "@/pages/FDAList";
import FDADetail from "@/pages/FDADetail";
import FDANew from "@/pages/FDANew";
import { AuthProvider } from "@/context/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<DashboardLayout><Index /></DashboardLayout>} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/pda" element={<RequireAuth><DashboardLayout><PDAList /></DashboardLayout></RequireAuth>} />
            <Route path="/pda/new" element={<RequireAuth><DashboardLayout><NewPDAWizard /></DashboardLayout></RequireAuth>} />
            <Route path="/pda/:id/review" element={<RequireAuth><DashboardLayout><PDAReview /></DashboardLayout></RequireAuth>} />
            <Route path="/fda" element={<RequireAuth><DashboardLayout><FDAList /></DashboardLayout></RequireAuth>} />
            <Route path="/fda/new" element={<RequireAuth><DashboardLayout><FDANew /></DashboardLayout></RequireAuth>} />
            <Route path="/fda/:id" element={<RequireAuth><DashboardLayout><FDADetail /></DashboardLayout></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
