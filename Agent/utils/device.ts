// Device Utility Functions
import * as Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@device_id';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'web' | 'unknown';
  platform: string;
  os: string;
  browser?: string;
}

/**
 * Get or create unique device ID
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    // Try to get stored device ID
    const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedDeviceId) {
      return storedDeviceId;
    }

    // Generate new device ID
    let deviceId: string;
    
    if (Platform.OS === 'web') {
      // For web, use localStorage or generate UUID
      const webDeviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (webDeviceId) {
        await AsyncStorage.setItem(DEVICE_ID_KEY, webDeviceId);
        return webDeviceId;
      }
      deviceId = generateUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    } else {
      // For mobile, use installation ID from expo-constants
      const installationId = Constants.installationId;
      if (installationId) {
        deviceId = installationId;
      } else {
        // Fallback to UUID
        deviceId = generateUUID();
      }
    }

    // Store device ID
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to generated UUID
    return generateUUID();
  }
};

/**
 * Generate UUID v4
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Get device information
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  const deviceId = await getDeviceId();
  
  let deviceName = 'Unknown Device';
  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'web' | 'unknown' = 'unknown';
  let platform = Platform.OS;
  let os = '';
  let browser: string | undefined;

  if (Platform.OS === 'web') {
    deviceType = 'web';
    platform = 'web';
    os = navigator.platform || 'Unknown';
    browser = getBrowserName();
    deviceName = `${browser} on ${os}`;
  } else if (Platform.OS === 'ios') {
    deviceType = Platform.isPad ? 'tablet' : 'mobile';
    platform = 'iOS';
    os = `${Platform.OS} ${Constants.systemVersion || ''}`.trim();
    deviceName = Constants.deviceName || 'iOS Device';
  } else if (Platform.OS === 'android') {
    deviceType = 'mobile';
    platform = 'Android';
    os = `${Platform.OS} ${Constants.systemVersion || ''}`.trim();
    deviceName = Constants.deviceName || 'Android Device';
  }

  return {
    deviceId,
    deviceName,
    deviceType,
    platform,
    os,
    browser,
  };
};

/**
 * Get browser name from user agent
 */
const getBrowserName = (): string => {
  if (typeof navigator === 'undefined') return 'Unknown';
  
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown Browser';
};

/**
 * Get IP address (for web only, mobile will be handled by backend)
 */
export const getIPAddress = (): string => {
  // IP address will be detected by backend
  // For web, we can try to get it, but it's usually not available client-side
  return '';
};

/**
 * Get user agent
 */
export const getUserAgent = (): string => {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return `React Native ${Platform.OS}`;
};


