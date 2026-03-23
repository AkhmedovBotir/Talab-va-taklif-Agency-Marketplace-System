import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@device_id';

/**
 * Get or create a unique device ID
 * Generates a UUID and stores it for future use
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Try to get stored device ID
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // Generate a new UUID
    const deviceId = generateUUID();

    // Store device ID for future use
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Return a fallback UUID
    return generateUUID();
  }
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get device information
 */
export async function getDeviceInfo(): Promise<{
  deviceId: string;
  deviceName: string;
  deviceType: string;
  platform: string;
  os: string;
  browser?: string;
}> {
  const deviceId = await getDeviceId();
  const deviceType = Platform.OS === 'ios' || Platform.OS === 'android' ? 'mobile' : Platform.OS === 'web' ? 'web' : 'unknown';
  const platform = Platform.OS;
  const os = Platform.Version?.toString() || 'unknown';
  
  // Get device name
  let deviceName = `${Platform.OS} Device`;
  if (Platform.OS === 'ios') {
    deviceName = 'iPhone';
  } else if (Platform.OS === 'android') {
    deviceName = 'Android Device';
  } else if (Platform.OS === 'web') {
    deviceName = 'Web Browser';
  }

  // Get browser info for web
  let browser: string | undefined;
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else browser = 'Unknown';
  }

  return {
    deviceId,
    deviceName,
    deviceType,
    platform,
    os,
    browser,
  };
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return `ReactNative/${Platform.OS}/${Platform.Version}`;
}

