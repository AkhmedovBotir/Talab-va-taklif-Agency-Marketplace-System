import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './app/Login';
import { Dashboard } from './app/Dashboard';
import { Orders } from './app/Orders';
import { OrdersHistory } from './app/OrdersHistory';
import { OrderDetail } from './app/OrderDetail';
import { Ombor } from './app/Ombor';
import { ProductView } from './app/ProductView';
import { ProductCreate } from './app/ProductCreate';
import { ProductEdit } from './app/ProductEdit';
import { Profile } from './app/Profile';
import { SelectRegions } from './app/SelectRegions';
import { Notifications } from './app/Notifications';
import { Statistika } from './app/Statistika';
import { PaymentDetail } from './app/PaymentDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f5f5f5',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #eee',
            borderTopColor: '#007AFF',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="buyurtmalar" element={<Orders />} />
            <Route path="buyurtmalar/history" element={<OrdersHistory />} />
            <Route path="buyurtmalar/order/:id" element={<OrderDetail />} />
            <Route path="ombor" element={<Ombor />} />
            <Route path="ombor/create" element={<ProductCreate />} />
            <Route path="ombor/product/:id" element={<ProductView />} />
            <Route path="ombor/product/:id/edit" element={<ProductEdit />} />
            <Route path="statistika" element={<Statistika />} />
            <Route path="statistika/payment/:id" element={<PaymentDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/select-regions" element={<SelectRegions />} />
            <Route path="habarlar" element={<Notifications />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
