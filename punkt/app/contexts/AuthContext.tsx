import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, Punkt } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  token: string | null;
  punkt: Punkt | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  /** `set-password` javobidan keyin sessiyani saqlash */
  registerSession: (token: string, punkt: Punkt) => Promise<void>;
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
            const validationPromise = apiService.getPunktMeProfile();
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Validation timeout')), 5000);
            });

            const profileRes = await Promise.race([
              validationPromise,
              timeoutPromise,
            ]) as Awaited<ReturnType<typeof apiService.getPunktMeProfile>>;
            if (profileRes?.data?.punkt) {
              setPunkt(profileRes.data.punkt);
              await AsyncStorage.setItem(PUNKT_KEY, JSON.stringify(profileRes.data.punkt));
            }
            
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

  const persistSession = async (newToken: string, newPunkt: Punkt) => {
    setToken(newToken);
    setPunkt(newPunkt);
    apiService.setToken(newToken);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, newToken),
      AsyncStorage.setItem(PUNKT_KEY, JSON.stringify(newPunkt)),
    ]);
  };

  const registerSession = async (newToken: string, newPunkt: Punkt) => {
    await persistSession(newToken, newPunkt);
  };

  const login = async (phone: string, password: string) => {
    const response = await apiService.login({ phone, password });

    if (response.data?.token && response.data?.punkt) {
      const { token: newToken, punkt: newPunkt } = response.data;
      await persistSession(newToken, newPunkt);
      return;
    }

    throw new Error('Noto\'g\'ri kirish javobi');
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
  
  return (
    <AuthContext.Provider
      value={{
        token,
        punkt,
        isLoading,
        login,
        registerSession,
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



