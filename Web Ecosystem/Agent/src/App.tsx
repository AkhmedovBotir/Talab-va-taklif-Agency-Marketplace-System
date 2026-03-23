import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './app/Login';
import { Orders } from './app/Orders';
import { OrdersHistory } from './app/OrdersHistory';
import { Finance } from './app/Finance';
import { Notifications } from './app/Notifications';
import { Profile } from './app/Profile';
import { OrderDetail } from './app/OrderDetail';
import { KPI } from './app/KPI';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #eee', borderTopColor: '#007AFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
            <Route index element={<Navigate to="/orders" replace />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders-history" element={<OrdersHistory />} />
            <Route path="finance" element={<Finance />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="order/:id" element={<OrderDetail />} />
            <Route path="kpi" element={<KPI />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
