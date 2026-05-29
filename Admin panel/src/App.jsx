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
import PermissionRoute from './components/Permissions/PermissionRoute';
import IntegrationApiKeys from './pages/Integration/IntegrationApiKeys';
import CommentaryPage from './pages/Commentary/CommentaryPage';
import ArchivePage from './pages/Archive/ArchivePage';
import QRSystemPage from './pages/QR/QRSystemPage';
import NeighborhoodShopSubscriptionsPage from './pages/NeighborhoodShops/NeighborhoodShopSubscriptionsPage';
import NotFoundPage from './pages/NotFoundPage';

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
              <Route
                index
                element={
                  <PermissionRoute permission="dashboard">
                    <Dashboard />
                  </PermissionRoute>
                }
              />
              <Route
                path="admins"
                element={
                  <PermissionRoute permission="adminlar">
                    <Admins />
                  </PermissionRoute>
                }
              />
              <Route
                path="regions"
                element={
                  <PermissionRoute permission="hududlar">
                    <Regions />
                  </PermissionRoute>
                }
              />
              <Route
                path="agents"
                element={
                  <PermissionRoute permission="agentlar">
                    <Agents />
                  </PermissionRoute>
                }
              />
              <Route
                path="managers"
                element={
                  <PermissionRoute permission="menejerlar">
                    <Managers />
                  </PermissionRoute>
                }
              />
              <Route
                path="punkts"
                element={
                  <PermissionRoute permission="punktlar">
                    <Punkts />
                  </PermissionRoute>
                }
              />
              <Route
                path="warehouse"
                element={
                  <PermissionRoute
                    anyOf={[
                      'kategoriyalar',
                      'mahsulotlar',
                      'maxalla maxsulotlari shablonlari',
                      'maxalla maxsulotlari',
                    ]}
                  >
                    <WarehouseLayout />
                  </PermissionRoute>
                }
              >
                <Route index element={<Navigate to="categories" replace />} />
                <Route
                  path="categories"
                  element={
                    <PermissionRoute permission="kategoriyalar">
                      <Categories hideHeader />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="products"
                  element={
                    <PermissionRoute permission="mahsulotlar">
                      <WarehouseProducts />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="neighborhood-products"
                  element={
                    <PermissionRoute
                      anyOf={['maxalla maxsulotlari shablonlari', 'maxalla maxsulotlari']}
                    >
                      <NeighborhoodProducts />
                    </PermissionRoute>
                  }
                />
              </Route>
              <Route
                path="marketplace-users"
                element={
                  <PermissionRoute permission="marketplace foydalanuvchilari">
                    <MarketplaceUsers />
                  </PermissionRoute>
                }
              />
              <Route
                path="commentary"
                element={
                  <PermissionRoute anyOf={['kommentariya shablonlari', 'kommentariyalar']}>
                    <CommentaryPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="qr-system"
                element={
                  <PermissionRoute permission="qr tizimi">
                    <QRSystemPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="archive"
                element={
                  <PermissionRoute permission="arxiv">
                    <ArchivePage />
                  </PermissionRoute>
                }
              />
              <Route
                path="order-pipeline-monitor"
                element={
                  <PermissionRoute anyOf={['buyurtmalar monitoringgi', 'barcha buyurtmalar']}>
                    <OrderPipelineMonitor />
                  </PermissionRoute>
                }
              />
              <Route
                path="statistics/transactions-by-area"
                element={
                  <PermissionRoute permission="trankzasiyalar">
                    <TransactionsByArea />
                  </PermissionRoute>
                }
              />
              <Route
                path="integration-api-keys"
                element={
                  <PermissionRoute permission="integratsiya kalitlari">
                    <IntegrationApiKeys />
                  </PermissionRoute>
                }
              />
              <Route
                path="neighborhood-shop-subscriptions"
                element={
                  <PermissionRoute permission="do'kon obunasi">
                    <NeighborhoodShopSubscriptionsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="contragents"
                element={
                  <PermissionRoute
                    anyOf={[
                      'kontragent turlari',
                      'kontragentlar',
                      "maxalla do'konlari",
                      "hamkorlik so'rovi",
                    ]}
                  >
                    <ContragentsLayout />
                  </PermissionRoute>
                }
              >
                <Route index element={<Navigate to="types" replace />} />
                <Route
                  path="types"
                  element={
                    <PermissionRoute permission="kontragent turlari">
                      <ContragentTypes />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="tuman"
                  element={
                    <PermissionRoute permission="kontragentlar">
                      <DistrictContragents />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="maxalla-dokonlar"
                  element={
                    <PermissionRoute permission="maxalla do'konlari">
                      <NeighborhoodShops />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="hamkorlik-sorovlari"
                  element={
                    <PermissionRoute permission="hamkorlik so'rovi">
                      <PartnerRequests />
                    </PermissionRoute>
                  }
                />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
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
