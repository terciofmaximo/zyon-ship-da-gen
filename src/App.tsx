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
import AcceptInvite from "@/pages/AcceptInvite";
import ResetPassword from "@/pages/ResetPassword";
import NoOrganization from "@/pages/NoOrganization";
import OrganizationSettings from "@/pages/OrganizationSettings";
import PlatformAdmin from "@/pages/PlatformAdmin";
import SeedAdmin from "@/pages/SeedAdmin";
import InviteDisabled from "./pages/InviteDisabled";
import PublicPDANew from "./pages/PublicPDANew";
import PublicPDAList from "./pages/PublicPDAList";
import PublicPDAView from "./pages/PublicPDAView";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import EmailConfirmed from "./pages/EmailConfirmed";
import { AuthProvider } from "@/context/AuthProvider";
import { OrgProvider } from "@/context/OrgProvider";
import { TenantProvider } from "@/context/TenantProvider";
import { CompanyProvider } from "@/context/CompanyProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <OrgProvider>
            <TenantProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public PDA routes - no auth required */}
                <Route path="/" element={<Navigate to="/pda/new" replace />} />
                <Route path="/pda/new" element={<PublicPDANew />} />
                <Route path="/pda" element={<PublicPDAList />} />
                <Route path="/pda/:trackingId" element={<PublicPDAView />} />
                
                {/* Disabled invite routes */}
                <Route path="/invite/*" element={<InviteDisabled />} />
                <Route path="/auth/accept-invite" element={<InviteDisabled />} />
                
                {/* Auth routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/verify-email" element={<VerifyEmail />} />
                <Route path="/auth/confirmed" element={<EmailConfirmed />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/seed-admin" element={<SeedAdmin />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={<RequireAuth><DashboardLayout><Index /></DashboardLayout></RequireAuth>} />
                <Route path="/no-organization" element={<RequireAuth><NoOrganization /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><DashboardLayout><OrganizationSettings /></DashboardLayout></RequireAuth>} />
                <Route path="/organization/settings" element={<Navigate to="/settings" replace />} />
                <Route path="/platform-admin" element={<RequireAuth><PlatformAdmin /></RequireAuth>} />
                <Route path="/pda/:id/review" element={<RequireAuth><DashboardLayout><PDAReview /></DashboardLayout></RequireAuth>} />
                <Route path="/fda" element={<RequireAuth><DashboardLayout><FDAList /></DashboardLayout></RequireAuth>} />
                <Route path="/fda/new" element={<RequireAuth><DashboardLayout><FDANew /></DashboardLayout></RequireAuth>} />
                <Route path="/fda/:id" element={<RequireAuth><DashboardLayout><FDADetail /></DashboardLayout></RequireAuth>} />
                <Route path="/fda/:fdaId/line/:lineId" element={<RequireAuth><DashboardLayout><FDALineDetail /></DashboardLayout></RequireAuth>} />
                
                {/* Development fallback routes with /t/{slug} prefix */}
                <Route path="/t/:slug" element={<RequireAuth><DashboardLayout><Index /></DashboardLayout></RequireAuth>} />
                <Route path="/t/:slug/auth" element={<AuthPage />} />
                <Route path="/t/:slug/auth/accept-invite" element={<InviteDisabled />} />
                <Route path="/t/:slug/auth/reset-password" element={<ResetPassword />} />
                <Route path="/t/:slug/settings" element={<RequireAuth><DashboardLayout><OrganizationSettings /></DashboardLayout></RequireAuth>} />
                <Route path="/t/:slug/pda" element={<PublicPDAList />} />
                <Route path="/t/:slug/pda/new" element={<PublicPDANew />} />
                <Route path="/t/:slug/pda/:id/review" element={<RequireAuth><DashboardLayout><PDAReview /></DashboardLayout></RequireAuth>} />
                <Route path="/t/:slug/fda" element={<RequireAuth><DashboardLayout><FDAList /></DashboardLayout></RequireAuth>} />
                <Route path="/t/:slug/fda/new" element={<RequireAuth><DashboardLayout><FDANew /></DashboardLayout></RequireAuth>} />
                <Route path="/t/:slug/fda/:id" element={<RequireAuth><DashboardLayout><FDADetail /></DashboardLayout></RequireAuth>} />
                <Route path="/t/:slug/fda/:fdaId/line/:lineId" element={<RequireAuth><DashboardLayout><FDALineDetail /></DashboardLayout></RequireAuth>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </TooltipProvider>
            </TenantProvider>
          </OrgProvider>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
