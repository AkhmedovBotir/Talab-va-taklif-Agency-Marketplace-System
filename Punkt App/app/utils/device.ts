import * as Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@device_id';

/**
 * Get or create a unique device ID
 * This ID is stored in AsyncStorage and persists across app restarts
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // Generate new device ID
    const deviceId = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to generated ID if storage fails
    return generateDeviceId();
  }
}

/**
 * Generate a unique device ID
 * Uses device info + timestamp + random string
 */
function generateDeviceId(): string {
  const deviceInfo = Constants.deviceName || 'Unknown';
  const platform = Platform.OS;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  return `${platform}-${deviceInfo}-${timestamp}-${random}`.replace(/\s/g, '-');
}

/**
 * Get device information for verification
 */
export function getDeviceInfo() {
  const deviceName = Constants.deviceName || 'Unknown Device';
  const platform = Platform.OS;
  const osVersion = Platform.Version;
  
  return {
    deviceName,
    deviceType: getDeviceType(),
    platform: platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Web',
    os: `${platform} ${osVersion}`,
  };
}

/**
 * Determine device type based on platform
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' | 'web' | 'unknown' {
  if (Platform.OS === 'web') {
    return 'web';
  }
  
  // For mobile platforms, we assume mobile (can be enhanced with device detection)
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // Could check screen size here to determine tablet vs mobile
    return 'mobile';
  }
  
  return 'unknown';
}

/**
 * Clear stored device ID (useful for testing or logout)
 */
export async function clearDeviceId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error('Error clearing device ID:', error);
  }
}



