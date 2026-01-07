import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Admins from './pages/Admins/Admins';
import Regions from './pages/Regions/Regions';
import Contragents from './pages/Contragents/Contragents';
import Agents from './pages/Agents/Agents';
import Punkts from './pages/Punkts/Punkts';
import SMSVerifications from './pages/SMSVerifications/SMSVerifications';
import MarketplaceUsers from './pages/MarketplaceUsers/MarketplaceUsers';
import OrdersMain from './pages/Orders/OrdersMain';
import Settings from './pages/Settings/Settings';
import KPIMain from './pages/KPI/KPIMain';
import SalesStatistics from './pages/Statistics/SalesStatistics';
import Notifications from './pages/Notifications/Notifications';
import ReviewsMain from './pages/Reviews/ReviewsMain';
import OmborMain from './pages/Ombor/OmborMain';
import PartnershipRequests from './pages/PartnershipRequests/PartnershipRequests';
import FinanceMain from './pages/Finance/FinanceMain';
import ArchiveMain from './pages/Archive/ArchiveMain';
import ArchivedPunktWorkHistory from './pages/Archive/ArchivedPunktWorkHistory';
import ArchivedAgentWorkHistory from './pages/Archive/ArchivedAgentWorkHistory';
import CertificateAssignment from './pages/CertificateAssignment/CertificateAssignment';
import NotFound from './pages/NotFound/NotFound';

function App() {
  return (
    <SnackbarProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <DashboardLayout />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="admins" element={<Admins />} />
              <Route path="regions" element={<Regions />} />
              <Route path="contragents" element={<Contragents />} />
              <Route path="agents" element={<Agents />} />
              <Route path="punkts" element={<Punkts />} />
              <Route path="ombor" element={<OmborMain />} />
              <Route path="sms-verifications" element={<SMSVerifications />} />
              <Route path="marketplace-users" element={<MarketplaceUsers />} />
              <Route path="orders" element={<OrdersMain />} />
              <Route path="kpi" element={<KPIMain />} />
              <Route path="statistics" element={<SalesStatistics />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="reviews" element={<ReviewsMain />} />
              <Route path="partnership-requests" element={<PartnershipRequests />} />
              <Route path="finance" element={<FinanceMain />} />
              <Route path="archive" element={<ArchiveMain />} />
              <Route path="archive/punkts/:id/work" element={<ArchivedPunktWorkHistory />} />
              <Route path="archive/agents/:id/work" element={<ArchivedAgentWorkHistory />} />
              <Route path="certificate-assignment" element={<CertificateAssignment />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;
