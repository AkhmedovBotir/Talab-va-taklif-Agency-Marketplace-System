import { createContext, useContext, useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { getDeviceInfo } from '../utils/deviceUtils';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminData');
    
    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const deviceInfo = getDeviceInfo();
      
      // Add device headers to login request
      const response = await adminAPI.login(username, password, deviceInfo);
      
      // Check if device verification is required
      // This can happen if device is new, inactive, or not registered
      if (response.requiresDeviceVerification) {
        return {
          success: false,
          requiresDeviceVerification: true,
          phone: response.data?.phone,
          username: username, // Pass username for admin verification
          deviceId: deviceInfo.deviceId,
          deviceInfo,
          message: response.message || 'Qurilma tasdiqlash kerak',
        };
      }
      
      if (response.success) {
        const { admin: adminData, token: newToken } = response.data;
        
        localStorage.setItem('adminToken', newToken);
        localStorage.setItem('adminData', JSON.stringify(adminData));
        
        setToken(newToken);
        setAdmin(adminData);
        
        return { success: true };
      }
    } catch (error) {
      // Check if error indicates device verification is required
      // This can happen for NEW devices OR inactive devices
      // For inactive devices, we also allow device verification via SMS
      if (error.requiresDeviceVerification) {
        const deviceInfo = getDeviceInfo();
        const errorMessage = error.message || '';
        
        // Check if error is about inactive device
        // For inactive devices, we still allow device verification via SMS
        const isInactiveDevice = errorMessage.toLowerCase().includes('nofaol') || 
            errorMessage.toLowerCase().includes('inactive') ||
            errorMessage.toLowerCase().includes('faqat faol');
        
        if (isInactiveDevice) {
          // Inactive device - allow device verification via SMS
          return {
            success: false,
            requiresDeviceVerification: true,
            phone: error.data?.phone,
            username: username, // Pass username for admin verification
            deviceId: deviceInfo.deviceId,
            deviceInfo,
            message: errorMessage || 'Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so\'rang',
            isInactiveDevice: true, // Flag to show different message
          };
        }
        
        // Show device verification for new devices
        return {
          success: false,
          requiresDeviceVerification: true,
          phone: error.data?.phone,
          username: username, // Pass username for admin verification
          deviceId: deviceInfo.deviceId,
          deviceInfo,
          message: errorMessage || 'Qurilma tasdiqlash kerak',
        };
      }
      
      // Check if error message indicates inactive device (even without requiresDeviceVerification flag)
      const errorMessage = error.message || '';
      const isInactiveDevice = errorMessage.toLowerCase().includes('nofaol') || 
          errorMessage.toLowerCase().includes('inactive') ||
          errorMessage.toLowerCase().includes('faqat faol') ||
          errorMessage.toLowerCase().includes('qurilma topilmadi') ||
          errorMessage.toLowerCase().includes('qurilmani tasdiqlang');
      
      if (isInactiveDevice) {
        // Inactive device - allow device verification via SMS
        const deviceInfo = getDeviceInfo();
        return {
          success: false,
          requiresDeviceVerification: true,
          phone: error.data?.phone,
          username: username, // Pass username for admin verification
          deviceId: deviceInfo.deviceId,
          deviceInfo,
          message: errorMessage || 'Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so\'rang',
          isInactiveDevice: true, // Flag to show different message
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setToken(null);
    setAdmin(null);
  };

  const value = {
    admin,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



