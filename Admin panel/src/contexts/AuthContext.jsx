import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import {
  extractAdminFromResponse,
  parseAdminPermissions,
  setRecommendedPermissionNames,
} from '../utils/permissions';
import { getApiErrorStatus } from '../utils/apiError';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const clearStoredAuth = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
};

const loadPermissionNames = async () => {
  try {
    const items = await adminAPI.getPermissionNames();
    if (items.length) setRecommendedPermissionNames(items);
  } catch {
    /* fallback: DEFAULT_PERMISSION_NAMES */
  }
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const persistAdmin = useCallback((adminData, newToken) => {
    if (newToken) {
      localStorage.setItem('adminToken', newToken);
      setToken(newToken);
    }
    if (adminData) {
      const normalized = {
        ...adminData,
        permissions: parseAdminPermissions(adminData),
        fullname: adminData.fullname ?? adminData.name,
        name: adminData.name ?? adminData.fullname,
        id: adminData.id ?? adminData._id,
      };
      localStorage.setItem('adminData', JSON.stringify(normalized));
      setAdmin(normalized);
      setAuthError(null);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setAdmin(null);
    setAuthError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await adminAPI.getMe();
    const me = extractAdminFromResponse(res?.data);
    if (me) {
      persistAdmin(me);
      return me;
    }
    return null;
  }, [persistAdmin]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const storedToken = localStorage.getItem('adminToken');
        const storedAdmin = localStorage.getItem('adminData');

        if (!storedToken) return;

        setToken(storedToken);
        if (storedAdmin) {
          try {
            setAdmin(JSON.parse(storedAdmin));
          } catch {
            clearStoredAuth();
            return;
          }
        }

        const checkRes = await adminAPI.checkAuth();
        const checkData = checkRes?.data;
        if (!checkData?.valid) {
          logout();
          return;
        }
        if (checkData.status === 'inactive') {
          if (!cancelled) setAuthError('Admin faol emas');
          logout();
          return;
        }

        await loadPermissionNames();

        const res = await adminAPI.getMe();
        const me = extractAdminFromResponse(res?.data);
        if (!cancelled && me) {
          persistAdmin(me);
        } else if (!cancelled && !storedAdmin) {
          logout();
        }
      } catch (err) {
        const status = getApiErrorStatus(err);
        if (status === 403 && !cancelled) {
          setAuthError(err.message || 'Admin faol emas');
        }
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [logout, persistAdmin]);

  const login = async (username, password) => {
    try {
      const response = await adminAPI.login(username, password);
      const payload = response?.data;

      if (!payload?.token) {
        return { success: false, error: response?.message || 'Login javobida token yo‘q' };
      }

      const adminData = extractAdminFromResponse(payload);
      if (!adminData) {
        return { success: false, error: 'Login javobida admin ma’lumoti yo‘q' };
      }

      if (adminData.status === 'inactive') {
        return { success: false, error: 'Admin faol emas', status: 403 };
      }

      persistAdmin(adminData, payload.token);
      await loadPermissionNames();
      return { success: true, message: response?.message };
    } catch (error) {
      const status = getApiErrorStatus(error);
      let msg = error.message || 'Login failed';
      if (status === 401) msg = error.message || "Username yoki parol noto'g'ri";
      if (status === 403) msg = error.message || 'Admin faol emas';
      return { success: false, error: msg, status };
    }
  };

  const value = {
    admin,
    token,
    login,
    logout,
    refreshProfile,
    authError,
    isAuthenticated: !!token && !!admin,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
