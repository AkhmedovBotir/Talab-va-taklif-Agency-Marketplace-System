import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, Punkt } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  token: string | null;
  punkt: Punkt | null;
  isLoading: boolean;
  login: (phone: string, password: string, deviceId?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@punkt_token';
const PUNKT_KEY = '@punkt_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [punkt, setPunkt] = useState<Punkt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // isAuthenticated ni computed property sifatida emas, balki to'g'ridan-to'g'ri hisoblaymiz
  const isAuthenticated = !!token;


  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedPunkt] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(PUNKT_KEY),
      ]);

      if (storedToken && storedPunkt) {
        try {
          // Punkt ma'lumotlarini parse qilish
          const parsedPunkt = JSON.parse(storedPunkt);
          
          // Token va punkt ma'lumotlarini restore qilish
          // Avval apiService ga token o'rnatamiz
          apiService.setToken(storedToken);
          
          // Keyin state ga o'rnatamiz - bu asinxron, lekin darhol ishlaydi
          // React state updates asinxron, shuning uchun biz state ni darhol yangilaymiz
          setToken(storedToken);
          setPunkt(parsedPunkt);
          
          // Token validation - biror API so'rovi yuborib token yaroqliligini tekshirish
          // Agar token yaroqsiz bo'lsa, faqat clear qilamiz, logout emas
          apiService.setValidatingToken(true);
          
          try {
            // Minimal API so'rovi yuborib token yaroqliligini tekshirish
            // Masalan, notifications count so'rovi
            // Timeout qo'shamiz - 5 soniyadan keyin timeout bo'ladi
            const validationPromise = apiService.getUnreadNotificationsCount();
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Validation timeout')), 5000);
            });
            
            await Promise.race([
              validationPromise,
              timeoutPromise,
            ]);
            
            // Validation muvaffaqiyatli bo'lsa, token va punkt to'g'ri o'rnatilgan
            // State yangilanishini kutmaysiz, chunki React buni o'zi boshqaradi
            // Lekin biz token va punkt ni to'g'ri o'rnatganimizga ishonch hosil qilamiz
          } catch (error: any) {
            // Faqat 401 xatosi bo'lsa, token yaroqsiz deb hisoblaymiz
            // Boshqa xatolar (network, timeout, va h.k.) uchun token saqlanadi
            if (error.status === 401) {
              // Token yaroqsiz bo'lsa, faqat clear qilamiz, logout emas
              setToken(null);
              setPunkt(null);
              apiService.setToken(null);
              await Promise.all([
                AsyncStorage.removeItem(TOKEN_KEY),
                AsyncStorage.removeItem(PUNKT_KEY),
              ]);
            }
            // Token saqlanadi, chunki bu network yoki timeout xatosi
          } finally {
            apiService.setValidatingToken(false);
          }
        } catch (parseError) {
          console.error('Error parsing punkt data:', parseError);
          // Parse xatosi bo'lsa, ma'lumotlarni tozalaymiz
          setToken(null);
          setPunkt(null);
          apiService.setToken(null);
          await Promise.all([
            AsyncStorage.removeItem(TOKEN_KEY),
            AsyncStorage.removeItem(PUNKT_KEY),
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      // Xatolik bo'lsa, ma'lumotlarni tozalaymiz
      setToken(null);
      setPunkt(null);
      apiService.setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string, deviceId?: string) => {
    try {
      const response = await apiService.login({ phone, password }, deviceId);
      
      // Check if device verification is required
      if ('requiresDeviceVerification' in response && response.requiresDeviceVerification) {
        const error: any = new Error(response.message || 'Qurilma tasdiqlash kerak');
        error.status = 403;
        error.requiresDeviceVerification = true;
        throw error;
      }

      // Check if response has data with token and punkt
      if (response.data && 'token' in response.data && 'punkt' in response.data) {
        const { token: newToken, punkt: newPunkt } = response.data;
        
        console.log('✅ Token topildi:', newToken ? 'Mavjud' : 'Yo\'q');
        console.log('✅ Punkt topildi:', newPunkt ? 'Mavjud' : 'Yo\'q');
        console.log('📦 Punkt data:', JSON.stringify(newPunkt, null, 2));

        if (newToken && newPunkt) {
          console.log('💾 Token va Punkt saqlanmoqda...');
          console.log('📦 Token uzunligi:', newToken.length);
          console.log('📦 Punkt name:', newPunkt.name);
          
          // Avval state ga o'rnatamiz
          setToken(newToken);
          setPunkt(newPunkt);
          apiService.setToken(newToken);
          
          console.log('✅ State ga o\'rnatildi');
          
          // Keyin AsyncStorage ga saqlaymiz
          try {
            await Promise.all([
              AsyncStorage.setItem(TOKEN_KEY, newToken),
              AsyncStorage.setItem(PUNKT_KEY, JSON.stringify(newPunkt)),
            ]);
            
            console.log('✅ AsyncStorage ga saqlandi');
            
            // Saqlangan ma'lumotlarni tekshirib ko'ramiz
            const [savedToken, savedPunkt] = await Promise.all([
              AsyncStorage.getItem(TOKEN_KEY),
              AsyncStorage.getItem(PUNKT_KEY),
            ]);
            
            if (savedToken === newToken) {
              console.log('✅ Token to\'g\'ri saqlandi');
            } else {
              console.error('❌ Token saqlashda muammo - tokenlar mos kelmaydi');
            }
            
            if (savedPunkt) {
              const savedPunktParsed = JSON.parse(savedPunkt);
              if (savedPunktParsed._id === newPunkt._id) {
                console.log('✅ Punkt to\'g\'ri saqlandi');
              } else {
                console.error('❌ Punkt saqlashda muammo - punktlar mos kelmaydi');
              }
            }
            
            console.log('✅ Token va Punkt muvaffaqiyatli saqlandi va tekshirildi');
          } catch (storageError) {
            console.error('❌ AsyncStorage ga saqlashda xatolik:', storageError);
            throw storageError;
          }
        } else {
          console.error('❌ Token yoki Punkt yo\'q');
          throw new Error('Invalid login response: missing token or punkt');
        }
      } else {
        console.error('❌ Response.data yoki token/punkt yo\'q');
        console.error('❌ Response structure:', JSON.stringify(response, null, 2));
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('❌ Login xatosi:', error);
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      console.log('🔴 Logging out...');
      // Clear state immediately so navigation can happen
      setToken(null);
      setPunkt(null);
      apiService.setToken(null);

      // Clear storage in background
      Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(PUNKT_KEY),
      ]).catch((error) => {
        console.error('Error clearing storage:', error);
      });
      
      console.log('✅ Logout completed, user will be redirected to login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if there's an error, clear the state
      setToken(null);
      setPunkt(null);
      apiService.setToken(null);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Set device error callback separately to avoid dependency issues
  useEffect(() => {
    // Set device error callback to logout user
    // This callback should only be set once, not re-set when logout changes
    apiService.setOnDeviceError(() => {
      logout();
    });
  }, [logout]);
  
  console.log('🔄 AuthProvider render - token:', token ? 'Mavjud' : 'Yo\'q', 'isAuthenticated:', isAuthenticated);
  
  return (
    <AuthContext.Provider
      value={{
        token,
        punkt,
        isLoading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



