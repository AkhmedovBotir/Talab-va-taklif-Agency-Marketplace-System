import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LocationProvider } from './contexts/LocationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { ModalProvider } from './contexts/ModalContext';

import Layout from './app/Layout';
import Home from './app/Home';
import Shops from './app/Shops';
import Search from './app/Search';
import Cart from './app/Cart';
import Profile from './app/Profile';
import Login from './app/Login';
import Register from './app/Register';
import RegisterForm from './app/RegisterForm';
import SmsVerify from './app/SmsVerify';
import ForgotPassword from './app/ForgotPassword';
import ResetPassword from './app/ResetPassword';
import Product from './app/Product';
import Checkout from './app/Checkout';
import Orders from './app/Orders';
import Order from './app/Order';
import Notifications from './app/Notifications';
import PartnershipRequests from './app/PartnershipRequests';

function LoadingScreen() {
  return (
    <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="loading-spinner" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />
      <Route path="/register" element={<GuestGuard><Register /></GuestGuard>} />
      <Route path="/forgot-password" element={<GuestGuard><ForgotPassword /></GuestGuard>} />
      <Route path="/reset-password" element={<GuestGuard><ResetPassword /></GuestGuard>} />
      <Route path="/sms-verify" element={<SmsVerify />} />
      <Route path="/register-form" element={<RegisterForm />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route index element={<Home />} />
        <Route path="shops" element={<Shops />} />
        <Route path="search" element={<Search />} />
        <Route path="cart" element={<Cart />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="/product/:id" element={<AuthGuard><Product /></AuthGuard>} />
      <Route path="/checkout" element={<AuthGuard><Checkout /></AuthGuard>} />
      <Route path="/order" element={<AuthGuard><Orders /></AuthGuard>} />
      <Route path="/order/:id" element={<AuthGuard><Order /></AuthGuard>} />
      <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
      <Route path="/partnership-requests" element={<AuthGuard><PartnershipRequests /></AuthGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <ModalProvider>
            <CartProvider>
              <NotificationProvider>
                <SnackbarProvider>
                  <AppRoutes />
                </SnackbarProvider>
              </NotificationProvider>
            </CartProvider>
          </ModalProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
