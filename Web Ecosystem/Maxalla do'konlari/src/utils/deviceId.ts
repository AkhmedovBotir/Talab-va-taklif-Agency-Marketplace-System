/**
 * Web: device ID and device info for browser
 */

const STORAGE_KEY = 'maxalla_device_id';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return generateUUID();
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

function getBrowserName(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Unknown Browser';
}

export function getDeviceInfo(): {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  os: string;
  browser?: string;
  userAgent?: string;
} {
  const deviceId = getDeviceId();
  const os = typeof navigator !== 'undefined' ? navigator.platform || 'Unknown' : 'Unknown';
  const browser = getBrowserName();
  const deviceName = `${browser} on ${os}`;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return {
    deviceId,
    deviceName,
    deviceType: 'desktop',
    platform: 'web',
    os: os.trim(),
    browser,
    userAgent,
  };
}

export function getUserAgent(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent : '';
}
