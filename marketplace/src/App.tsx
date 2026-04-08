import { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthPage } from './components/Auth';
import { HomePage } from './pages/Home';
import { CategoriesPage } from './pages/Categories';
import { ProfilePage } from './pages/Profile';
import { SearchPage } from './pages/Search';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { PartnerRequestsPage } from './pages/PartnerRequestsPage';
import { BottomNav } from './components/BottomNav';
import { WebCartProvider } from './hooks/useWebCart';
import { WebNotificationsProvider } from './hooks/useWebNotifications';
import { api, setAuthFailureHandler } from './services/api';

function BottomNavShell() {
  const { pathname } = useLocation();
  const hide =
    pathname === '/checkout' || pathname.startsWith('/orders');
  if (hide) return null;
  return <BottomNav />;
}

function ProtectedRoute({
  isAuthenticated,
  onAuthInvalid,
  children,
}: {
  isAuthenticated: boolean;
  onAuthInvalid: () => void;
  children: ReactNode;
}) {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!isAuthenticated) {
        setIsChecking(false);
        return;
      }
      try {
        await api.auth.getProfile();
        if (!cancelled) setIsChecking(false);
      } catch {
        if (!cancelled) {
          onAuthInvalid();
          setIsChecking(false);
        }
      }
    };
    void verify();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, onAuthInvalid]);

  if (isChecking) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    setAuthFailureHandler(() => {
      setIsAuthenticated(false);
      setAuthRequired(true);
    });
    return () => setAuthFailureHandler(null);
  }, []);

  if (isAuthenticated === null) return null;
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setAuthRequired(false);
  };
  const handleAuthInvalid = () => {
    setIsAuthenticated(false);
    setAuthRequired(true);
  };
  const requireAuth = (element: ReactNode) => (
    <ProtectedRoute
      isAuthenticated={!!isAuthenticated}
      onAuthInvalid={handleAuthInvalid}
    >
      {element}
    </ProtectedRoute>
  );

  return (
    <WebCartProvider>
      <WebNotificationsProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-100">
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<CategoriesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <AuthPage onAuthSuccess={handleAuthSuccess} />
                )
              }
            />
            <Route path="/profile" element={requireAuth(<ProfilePage onLogout={() => {
              localStorage.removeItem('token');
              setIsAuthenticated(false);
              setAuthRequired(false);
            }} />)} />
            <Route path="/checkout" element={requireAuth(<CheckoutPage />)} />
            <Route path="/orders/:id" element={requireAuth(<OrderDetailPage />)} />
            <Route path="/orders" element={requireAuth(<OrdersPage />)} />
            <Route path="/partner-requests" element={requireAuth(<PartnerRequestsPage />)} />
            <Route path="*" element={<Navigate to={authRequired && !isAuthenticated ? '/login' : '/'} replace />} />
          </Routes>
            <BottomNavShell />
          </div>
        </BrowserRouter>
      </WebNotificationsProvider>
    </WebCartProvider>
  );
}
