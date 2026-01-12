import { Platform } from 'react-native';

/**
 * Get unique device ID (synchronous)
 * In production, you should use expo-device and expo-application for native platforms
 */
export function getDeviceId(): string {
  if (Platform.OS === 'web') {
    return getWebDeviceId();
  }
  
  // For native, use a stored UUID or generate one
  // In a real implementation, you'd use AsyncStorage or SecureStore
  const storedId = getStoredDeviceId();
  if (storedId) {
    return storedId;
  }
  
  const newId = generateUUID();
  storeDeviceId(newId);
  return newId;
}

/**
 * Get device information
 */
export function getDeviceInfo(): {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  os: string;
  browser?: string;
} {
  const deviceId = getDeviceId();
  
  let deviceName = 'Unknown Device';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'mobile';
  let platform = Platform.OS;
  let os = '';
  let browser: string | undefined;

  if (Platform.OS === 'ios') {
    deviceName = 'iOS Device';
    deviceType = 'mobile';
    os = 'iOS';
    // In production, use: Device.modelName, Device.osVersion, Device.deviceType
  } else if (Platform.OS === 'android') {
    deviceName = 'Android Device';
    deviceType = 'mobile';
    os = 'Android';
    // In production, use: Device.modelName, Device.osVersion, Device.deviceType
  } else if (Platform.OS === 'web') {
    deviceType = 'desktop';
    os = typeof navigator !== 'undefined' ? navigator.platform || 'Unknown' : 'Unknown';
    browser = getBrowserName();
    deviceName = `${browser} on ${os}`;
  }

  return {
    deviceId,
    deviceName,
    deviceType,
    platform,
    os: os.trim(),
    browser,
  };
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  if (Platform.OS === 'web') {
    return navigator.userAgent || '';
  }
  
  const deviceInfo = getDeviceInfo();
  return `${deviceInfo.platform}/${deviceInfo.os} ${deviceInfo.deviceName}`;
}

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get device ID for web (from localStorage)
 */
function getWebDeviceId(): string {
  if (typeof window === 'undefined') {
    return generateUUID();
  }
  
  const storageKey = 'maxalla_device_id';
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
}

/**
 * Get stored device ID (for native platforms)
 */
function getStoredDeviceId(): string | null {
  // In a real implementation, use AsyncStorage or SecureStore
  // For now, return null to generate a new one
  return null;
}

/**
 * Store device ID (for native platforms)
 */
function storeDeviceId(deviceId: string): void {
  // In a real implementation, use AsyncStorage or SecureStore
  // For now, do nothing
}

/**
 * Get browser name from user agent
 */
function getBrowserName(): string {
  if (typeof navigator === 'undefined') {
    return 'Unknown';
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return 'Chrome';
  } else if (userAgent.includes('firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'Safari';
  } else if (userAgent.includes('edg')) {
    return 'Edge';
  } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
    return 'Opera';
  }
  
  return 'Unknown Browser';
}
