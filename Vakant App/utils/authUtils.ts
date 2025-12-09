import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { STORAGE_KEYS } from '@/constants/config';

/**
 * Logout user and redirect to login page
 * This function clears all auth data and redirects to login
 */
export async function handleUnauthorized(): Promise<void> {
  try {
    // Clear all auth data
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
    ]);
    
    // Redirect to login page
    router.replace('/auth/login');
  } catch (error) {
    console.error('Error handling unauthorized:', error);
    // Still redirect even if clearing storage fails
    router.replace('/auth/login');
  }
}

/**
 * Check if error is unauthorized (401) or user not found
 */
export function isUnauthorizedError(error: any, response?: Response): boolean {
  // Check HTTP status code
  if (response?.status === 401) {
    return true;
  }
  
  // Check error message for common unauthorized messages
  const errorMessage = error?.message?.toLowerCase() || '';
  const unauthorizedMessages = [
    'unauthorized',
    'unauthorized access',
    'token expired',
    'invalid token',
    'authentication required',
    'nomzod topilmadi',
    'user not found',
    'applicant not found',
    'foydalanuvchi topilmadi',
    'авторизация',
    'авторизоваться',
  ];
  
  return unauthorizedMessages.some(msg => errorMessage.includes(msg));
}



