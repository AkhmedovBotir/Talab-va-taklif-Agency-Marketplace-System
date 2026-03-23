import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DeliveryProviderAuthProvider, useDeliveryProviderAuth } from './contexts/DeliveryProviderAuthContext';
import { setUnauthorizedHandler, clearUnauthorizedHandler } from './services/api';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Orders } from './components/Orders';
import { OrderDetail } from './components/OrderDetail';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UnauthorizedHandler() {
  const { logout } = useDeliveryProviderAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout().then(() => navigate('/login', { replace: true }));
    });
    return () => clearUnauthorizedHandler();
  }, [logout, navigate]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useDeliveryProviderAuth();

  if (loading) {
    return (
      <div className="loadingScreen">
        <div className="spinner" />
        <p>Yuklanmoqda...</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <DeliveryProviderAuthProvider>
        <UnauthorizedHandler />
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
            <Route index element={<Navigate to="/orders" replace />} />
            <Route path="orders" element={<Orders />} />
            <Route path="order/:id" element={<OrderDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DeliveryProviderAuthProvider>
    </BrowserRouter>
  );
}
