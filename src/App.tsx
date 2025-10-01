import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/shared/components/DashboardLayout";
import Index from "@/shared/pages/Index";
import NotFound from "@/shared/pages/NotFound";
import PDAList from "@/features/pda/pages/PDAList";
import PDAReview from "@/features/pda/pages/PDAReview";
import { NewPDAWizard } from "@/features/pda/components/NewPDAWizard";
import AuthPage from "@/features/auth/pages/Auth";
import FDAList from "@/features/fda/pages/FDAList";
import FDADetail from "@/features/fda/pages/FDADetail";
import FDANew from "@/features/fda/pages/FDANew";
import FDALineDetail from "@/features/fda/pages/FDALineDetail";
import InviteAccept from "@/features/auth/pages/InviteAccept";
import AcceptInvite from "@/features/auth/pages/AcceptInvite";
import ResetPassword from "@/features/auth/pages/ResetPassword";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import NoOrganization from "@/features/org/pages/NoOrganization";
import OrganizationSettings from "@/features/org/pages/OrganizationSettings";
import PlatformAdmin from "@/features/admin/pages/PlatformAdmin";
import SeedAdmin from "@/features/admin/pages/SeedAdmin";
import InviteDisabled from "@/features/auth/pages/InviteDisabled";
import PublicPDANew from "@/features/pda/pages/PublicPDANew";
import PublicPDAList from "@/features/pda/pages/PublicPDAList";
import PublicPDAView from "@/features/pda/pages/PublicPDAView";
import Signup from "@/features/auth/pages/Signup";
import VerifyEmail from "@/features/auth/pages/VerifyEmail";
import EmailConfirmed from "@/features/auth/pages/EmailConfirmed";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { OrgProvider } from "@/features/org/context/OrgProvider";
import { TenantProvider } from "@/features/org/context/TenantProvider";
import { CompanyProvider } from "@/features/org/context/CompanyProvider";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { RootRedirect } from "@/shared/components/RootRedirect";

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
                {/* Root redirect */}
                <Route path="/" element={<RootRedirect />} />
                
                {/* Disabled invite routes */}
                <Route path="/invite/*" element={<InviteDisabled />} />
                <Route path="/auth/accept-invite" element={<InviteDisabled />} />
                
                {/* Auth routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/verify-email" element={<VerifyEmail />} />
                <Route path="/auth/confirmed" element={<EmailConfirmed />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/seed-admin" element={<SeedAdmin />} />
                
                {/* Protected routes - ALL routes require authentication */}
                <Route path="/dashboard" element={<RequireAuth><DashboardLayout><Index /></DashboardLayout></RequireAuth>} />
                <Route path="/no-organization" element={<RequireAuth><NoOrganization /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><DashboardLayout><OrganizationSettings /></DashboardLayout></RequireAuth>} />
                <Route path="/organization/settings" element={<Navigate to="/settings" replace />} />
                <Route path="/platform-admin" element={<RequireAuth><DashboardLayout><PlatformAdmin /></DashboardLayout></RequireAuth>} />
                <Route path="/pda" element={<RequireAuth><DashboardLayout><PDAList /></DashboardLayout></RequireAuth>} />
                <Route path="/pda/new" element={<RequireAuth><DashboardLayout><PublicPDANew /></DashboardLayout></RequireAuth>} />
                <Route path="/pda/:trackingId" element={<RequireAuth><DashboardLayout><PublicPDAView /></DashboardLayout></RequireAuth>} />
                <Route path="/pda/:id/review" element={<RequireAuth><DashboardLayout><PDAReview /></DashboardLayout></RequireAuth>} />
                <Route path="/fda" element={<RequireAuth><DashboardLayout><FDAList /></DashboardLayout></RequireAuth>} />
                <Route path="/fda/new" element={<RequireAuth><DashboardLayout><FDANew /></DashboardLayout></RequireAuth>} />
                <Route path="/fda/:id" element={<RequireAuth><DashboardLayout><FDADetail /></DashboardLayout></RequireAuth>} />
                <Route path="/fda/:fdaId/line/:lineId" element={<RequireAuth><DashboardLayout><FDALineDetail /></DashboardLayout></RequireAuth>} />
                
                {/* Legacy /t/:slug routes - redirect to auth or protected routes */}
                <Route path="/t/:slug" element={<Navigate to="/auth" replace />} />
                <Route path="/t/:slug/*" element={<Navigate to="/auth" replace />} />
                
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
