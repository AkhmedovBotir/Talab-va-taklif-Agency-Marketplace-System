const DEVICE_ID_KEY = '@device_id';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  try {
    const storedId = localStorage.getItem(DEVICE_ID_KEY);
    if (storedId) return storedId;
    const deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch {
    return generateUUID();
  }
}

export function getDeviceInfo() {
  const deviceId = getDeviceId();
  const deviceName = typeof navigator !== 'undefined' ? 'Web Browser' : 'Web';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let browser = 'Unknown';
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
  }
  return {
    deviceId,
    deviceName,
    deviceType: 'web',
    platform: 'web',
    os: typeof navigator !== 'undefined' ? navigator.platform : '',
    browser,
    userAgent,
  };
}
