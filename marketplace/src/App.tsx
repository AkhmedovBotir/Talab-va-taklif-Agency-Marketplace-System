import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthPage } from './components/Auth';
import { HomePage } from './pages/Home';
import { CategoriesPage } from './pages/Categories';
import { ProfilePage } from './pages/Profile';
import { SearchPage } from './pages/Search';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { BottomNav } from './components/BottomNav';
import { WebCartProvider } from './hooks/useWebCart';
import { setAuthFailureHandler } from './services/api';

function BottomNavShell() {
  const { pathname } = useLocation();
  const hide =
    pathname === '/checkout' || pathname.startsWith('/orders');
  if (hide) return null;
  return <BottomNav />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    setAuthFailureHandler(() => {
      setIsAuthenticated(false);
    });
    return () => setAuthFailureHandler(null);
  }, []);

  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <WebCartProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<CategoriesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfilePage onLogout={() => {
              localStorage.removeItem('token');
              setIsAuthenticated(false);
            }} />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <BottomNavShell />
        </div>
      </BrowserRouter>
    </WebCartProvider>
  );
}
