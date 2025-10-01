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
import ForgotPassword from "@/pages/ForgotPassword";
import NoOrganization from "@/pages/NoOrganization";
import OrganizationSettings from "@/pages/OrganizationSettings";
import PlatformAdmin from "@/pages/PlatformAdmin";
import SeedAdmin from "@/pages/SeedAdmin";
import Financial from "@/pages/Financial";
import Schedule from "@/pages/Schedule";
import Billing from "@/pages/Billing";
import Reports from "@/pages/Reports";
import Clients from "@/pages/Clients";
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
import { RootRedirect } from "@/components/routing/RootRedirect";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RouteGuard>
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
                <Route path="/financial" element={<RequireAuth><DashboardLayout><Financial /></DashboardLayout></RequireAuth>} />
                <Route path="/schedule" element={<RequireAuth><DashboardLayout><Schedule /></DashboardLayout></RequireAuth>} />
                <Route path="/billing" element={<RequireAuth><DashboardLayout><Billing /></DashboardLayout></RequireAuth>} />
                <Route path="/reports" element={<RequireAuth><DashboardLayout><Reports /></DashboardLayout></RequireAuth>} />
                <Route path="/clients" element={<RequireAuth><DashboardLayout><Clients /></DashboardLayout></RequireAuth>} />
                
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
        </RouteGuard>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
