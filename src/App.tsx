import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import FDALineDetail from "@/pages/FDALineDetail";
import InviteAccept from "@/pages/InviteAccept";
import NoOrganization from "@/pages/NoOrganization";
import OrganizationSettings from "@/pages/OrganizationSettings";
import PlatformAdmin from "@/pages/PlatformAdmin";
import SeedAdmin from "@/pages/SeedAdmin";
import { AuthProvider } from "@/context/AuthProvider";
import { OrgProvider } from "@/context/OrgProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<DashboardLayout><Index /></DashboardLayout>} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/seed-admin" element={<SeedAdmin />} />
              <Route path="/invite" element={<InviteAccept />} />
              <Route path="/no-organization" element={<RequireAuth><NoOrganization /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><DashboardLayout><OrganizationSettings /></DashboardLayout></RequireAuth>} />
              <Route path="/organization/settings" element={<Navigate to="/settings" replace />} />
              <Route path="/platform-admin" element={<RequireAuth><PlatformAdmin /></RequireAuth>} />
              <Route path="/pda" element={<RequireAuth><DashboardLayout><PDAList /></DashboardLayout></RequireAuth>} />
              <Route path="/pda/new" element={<RequireAuth><DashboardLayout><NewPDAWizard /></DashboardLayout></RequireAuth>} />
              <Route path="/pda/:id/review" element={<RequireAuth><DashboardLayout><PDAReview /></DashboardLayout></RequireAuth>} />
              <Route path="/fda" element={<RequireAuth><DashboardLayout><FDAList /></DashboardLayout></RequireAuth>} />
              <Route path="/fda/new" element={<RequireAuth><DashboardLayout><FDANew /></DashboardLayout></RequireAuth>} />
              <Route path="/fda/:id" element={<RequireAuth><DashboardLayout><FDADetail /></DashboardLayout></RequireAuth>} />
              <Route path="/fda/:fdaId/line/:lineId" element={<RequireAuth><DashboardLayout><FDALineDetail /></DashboardLayout></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
