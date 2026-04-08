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
import ContragentsLayout from './pages/Contragents/ContragentsLayout';
import ContragentTypes from './pages/Contragents/ContragentTypes';
import DistrictContragents from './pages/Contragents/DistrictContragents';
import NeighborhoodShops from './pages/Contragents/NeighborhoodShops';
import PartnerRequests from './pages/Contragents/PartnerRequests';
import Agents from './pages/Agents/Agents';
import Punkts from './pages/Punkts/Punkts';
import Managers from './pages/Managers/Managers';
import Categories from './pages/Categories/Categories';
import WarehouseLayout from './pages/Warehouse/WarehouseLayout';
import WarehouseProducts from './pages/Warehouse/WarehouseProducts';
import NeighborhoodProducts from './pages/Warehouse/NeighborhoodProducts';
import MarketplaceUsers from './pages/Marketplace/MarketplaceUsers';
import OrderPipelineMonitor from './pages/Orders/OrderPipelineMonitor';
import TransactionsByArea from './pages/Statistics/TransactionsByArea';
import GeneralAdminRoute from './components/GeneralAdminRoute';
import IntegrationApiKeys from './pages/Integration/IntegrationApiKeys';
import CommentaryPage from './pages/Commentary/CommentaryPage';
import ArchivePage from './pages/Archive/ArchivePage';
import QRSystemPage from './pages/QR/QRSystemPage';

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
              <Route path="agents" element={<Agents />} />
              <Route path="managers" element={<Managers />} />
              <Route path="punkts" element={<Punkts />} />
              <Route path="warehouse" element={<WarehouseLayout />}>
                <Route index element={<Navigate to="categories" replace />} />
                <Route path="categories" element={<Categories hideHeader />} />
                <Route path="products" element={<WarehouseProducts />} />
                <Route path="neighborhood-products" element={<NeighborhoodProducts />} />
              </Route>
              <Route path="marketplace-users" element={<MarketplaceUsers />} />
              <Route path="commentary" element={<CommentaryPage />} />
              <Route
                path="qr-system"
                element={
                  <GeneralAdminRoute>
                    <QRSystemPage />
                  </GeneralAdminRoute>
                }
              />
              <Route
                path="archive"
                element={
                  <GeneralAdminRoute>
                    <ArchivePage />
                  </GeneralAdminRoute>
                }
              />
              <Route path="order-pipeline-monitor" element={<OrderPipelineMonitor />} />
              <Route path="statistics/transactions-by-area" element={<TransactionsByArea />} />
              <Route
                path="integration-api-keys"
                element={
                  <GeneralAdminRoute>
                    <IntegrationApiKeys />
                  </GeneralAdminRoute>
                }
              />
              <Route path="contragents" element={<ContragentsLayout />}>
                <Route index element={<Navigate to="types" replace />} />
                <Route path="types" element={<ContragentTypes />} />
                <Route path="tuman" element={<DistrictContragents />} />
                <Route path="maxalla-dokonlar" element={<NeighborhoodShops />} />
                <Route path="hamkorlik-sorovlari" element={<PartnerRequests />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;
