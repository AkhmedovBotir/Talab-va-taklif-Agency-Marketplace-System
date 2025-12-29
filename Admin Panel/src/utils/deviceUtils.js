// Utility functions for device management

/**
 * Get or generate a unique device ID
 * Stores device ID in localStorage for persistence
 */
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    // Generate a unique device ID
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
};

/**
 * Get device information from browser
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Detect device type
  let deviceType = 'unknown';
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
  } else if (/Windows|Mac|Linux/.test(platform)) {
    deviceType = 'desktop';
  } else if (/web/.test(userAgent.toLowerCase())) {
    deviceType = 'web';
  }
  
  // Detect platform
  let platformName = 'Unknown';
  if (/Windows/.test(platform)) {
    platformName = 'Windows';
  } else if (/Mac/.test(platform)) {
    platformName = 'macOS';
  } else if (/Linux/.test(platform)) {
    platformName = 'Linux';
  } else if (/Android/.test(userAgent)) {
    platformName = 'Android';
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    platformName = 'iOS';
  }
  
  // Detect OS version
  let os = 'Unknown';
  if (/Windows NT 10/.test(userAgent)) {
    os = 'Windows 10/11';
  } else if (/Windows NT 6.3/.test(userAgent)) {
    os = 'Windows 8.1';
  } else if (/Windows NT 6.2/.test(userAgent)) {
    os = 'Windows 8';
  } else if (/Windows NT 6.1/.test(userAgent)) {
    os = 'Windows 7';
  } else if (/Mac OS X (\d+[._]\d+)/.test(userAgent)) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    os = `macOS ${match[1].replace('_', '.')}`;
  } else if (/Android (\d+(\.\d+)?)/.test(userAgent)) {
    const match = userAgent.match(/Android (\d+(\.\d+)?)/);
    os = `Android ${match[1]}`;
  } else if (/OS (\d+[._]\d+)/.test(userAgent)) {
    const match = userAgent.match(/OS (\d+[._]\d+)/);
    os = `iOS ${match[1].replace('_', '.')}`;
  }
  
  // Detect browser
  let browser = 'Unknown';
  if (/Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Firefox/.test(userAgent)) {
    browser = 'Firefox';
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browser = 'Safari';
  } else if (/Edge|Edg/.test(userAgent)) {
    browser = 'Edge';
  } else if (/Opera|OPR/.test(userAgent)) {
    browser = 'Opera';
  }
  
  // Get device name (try to make it user-friendly)
  let deviceName = 'Unknown Device';
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    if (/iPhone/.test(userAgent)) {
      const match = userAgent.match(/iPhone OS \d+[._]\d+/);
      deviceName = 'iPhone';
    } else if (/iPad/.test(userAgent)) {
      deviceName = 'iPad';
    } else if (/Android/.test(userAgent)) {
      // Try to extract device model
      const match = userAgent.match(/Android.*?;\s*([^)]+)\)/);
      if (match) {
        deviceName = match[1].trim();
      } else {
        deviceName = 'Android Device';
      }
    }
  } else if (deviceType === 'desktop') {
    if (/Mac/.test(platform)) {
      deviceName = 'Mac';
    } else if (/Windows/.test(platform)) {
      deviceName = 'Windows PC';
    } else {
      deviceName = 'Desktop';
    }
  }
  
  return {
    deviceId: getDeviceId(),
    deviceName,
    deviceType,
    platform: platformName,
    os,
    browser,
    userAgent,
    ipAddress: null, // IP address should be detected on server side
  };
};



