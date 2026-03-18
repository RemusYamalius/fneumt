import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import NewRequest from "./pages/NewRequest";
import CommunicationHub from "./pages/CommunicationHub";
import DatabaseDashboard from "./pages/DatabaseDashboard";
import LocalOffice from "./pages/LocalOffice";
import IncomingRequests from "./pages/IncomingRequests";
import TrackRequest from "./pages/TrackRequest";
import UserManagement from "./pages/admin/UserManagement";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import Profile from "./pages/Profile";
import MembershipVerification from "./pages/MembershipVerification";
import JoinRequests from "./pages/JoinRequests";
import RoleGuard from "./components/RoleGuard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Navigate to="/login" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/new-request" element={<NewRequest />} />
              <Route path="/track" element={<TrackRequest />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/communication" element={<CommunicationHub />} />
              <Route path="/incoming-requests" element={<RoleGuard allowedRoles={['admin', 'national_secretary', 'deputy_national_secretary', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high']}><IncomingRequests /></RoleGuard>} />
              <Route path="/supervisor" element={<RoleGuard allowedRoles={['admin', 'national_secretary', 'deputy_national_secretary', 'regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high', 'provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high', 'local_coordinator']}><SupervisorDashboard /></RoleGuard>} />
              <Route path="/admin/users" element={<RoleGuard allowedRoles={['admin', 'national_secretary', 'deputy_national_secretary', 'regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high', 'provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high', 'local_coordinator']}><UserManagement /></RoleGuard>} />
              <Route path="/membership-verification" element={<RoleGuard allowedRoles={['admin', 'national_secretary', 'deputy_national_secretary', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high']}><MembershipVerification /></RoleGuard>} />
              <Route path="/join-requests" element={<RoleGuard allowedRoles={['admin', 'national_secretary', 'deputy_national_secretary', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high']}><JoinRequests /></RoleGuard>} />
              <Route path="/local-office" element={<RoleGuard allowedRoles={['local_coordinator']}><LocalOffice /></RoleGuard>} />
              <Route path="/database" element={<RoleGuard allowedRoles={['admin', 'national_secretary', 'deputy_national_secretary']}><DatabaseDashboard /></RoleGuard>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
