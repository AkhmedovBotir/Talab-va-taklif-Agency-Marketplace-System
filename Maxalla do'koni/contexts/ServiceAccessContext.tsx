import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import ServiceAccessBlockedModal from '../components/ServiceAccessBlockedModal';
import { apiService, ServiceAccessData } from '../services/api';
import { subscribeServiceAccessUpdate } from '../services/serviceAccessBridge';
import { useAuth } from './AuthContext';

interface ServiceAccessContextType {
  serviceAccess: ServiceAccessData | null;
  canOperate: boolean;
  loading: boolean;
  refreshServiceAccess: () => Promise<void>;
}

const ServiceAccessContext = createContext<ServiceAccessContextType | undefined>(undefined);

export function ServiceAccessProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [serviceAccess, setServiceAccess] = useState<ServiceAccessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyAccess = useCallback((access: ServiceAccessData) => {
    setServiceAccess(access);
    setChecked(true);
  }, []);

  const refreshServiceAccess = useCallback(async () => {
    if (!token) {
      setServiceAccess(null);
      setChecked(false);
      return;
    }
    setLoading(true);
    try {
      const access = await apiService.getServiceAccess(token);
      applyAccess(access);
    } catch {
      // Tarmoq xatosi — oldingi holatni saqlaymiz
    } finally {
      setLoading(false);
    }
  }, [token, applyAccess]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setServiceAccess(null);
      setChecked(false);
      return;
    }
    refreshServiceAccess();
  }, [isAuthenticated, token, refreshServiceAccess]);

  useEffect(() => {
    return subscribeServiceAccessUpdate(applyAccess);
  }, [applyAccess]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!isAuthenticated || !token) return;

    const blocked = checked && serviceAccess?.can_operate === false;
    const ms = blocked ? 30_000 : 120_000;
    pollRef.current = setInterval(() => {
      refreshServiceAccess();
    }, ms);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, token, checked, serviceAccess?.can_operate, refreshServiceAccess]);

  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && token) {
        refreshServiceAccess();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [token, refreshServiceAccess]);

  const canOperate = !checked || serviceAccess?.can_operate !== false;
  const showBlockedModal =
    isAuthenticated && checked && serviceAccess !== null && serviceAccess.can_operate === false;

  return (
    <ServiceAccessContext.Provider
      value={{
        serviceAccess,
        canOperate,
        loading,
        refreshServiceAccess,
      }}>
      {children}
      <ServiceAccessBlockedModal
        visible={showBlockedModal}
        access={serviceAccess}
        checking={loading}
        onRefresh={refreshServiceAccess}
      />
    </ServiceAccessContext.Provider>
  );
}

export function useServiceAccess() {
  const ctx = useContext(ServiceAccessContext);
  if (!ctx) {
    throw new Error('useServiceAccess must be used within ServiceAccessProvider');
  }
  return ctx;
}
