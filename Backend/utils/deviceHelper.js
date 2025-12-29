/**
 * Extract device information from request
 */
const extractDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '';

  // Extract device information from headers
  const deviceId = req.headers['x-device-id'] || req.body.deviceId || req.query.deviceId || null;
  const deviceName = req.headers['x-device-name'] || req.body.deviceName || null;
  const deviceType = req.headers['x-device-type'] || req.body.deviceType || detectDeviceType(userAgent);
  const platform = req.headers['x-platform'] || req.body.platform || detectPlatform(userAgent);
  const os = req.headers['x-os'] || req.body.os || detectOS(userAgent);
  const browser = req.headers['x-browser'] || req.body.browser || detectBrowser(userAgent);

  // Location (optional, from headers)
  const location = req.body.location || null;

  return {
    deviceId,
    deviceName,
    deviceType,
    platform,
    os,
    browser,
    ipAddress,
    userAgent,
    location,
  };
};

/**
 * Detect device type from user agent
 */
const detectDeviceType = (userAgent) => {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  if (ua.includes('desktop') || ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
    return 'desktop';
  }
  if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox')) {
    return 'web';
  }

  return 'unknown';
};

/**
 * Detect platform from user agent
 */
const detectPlatform = (userAgent) => {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS';
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';

  return 'unknown';
};

/**
 * Detect OS from user agent
 */
const detectOS = (userAgent) => {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('android')) {
    const match = ua.match(/android\s([0-9\.]*)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  if (ua.includes('iphone') || ua.includes('ipad')) {
    const match = ua.match(/os\s([0-9_]*)/);
    return match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  }
  if (ua.includes('windows')) {
    if (ua.includes('windows nt 10')) return 'Windows 10';
    if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
    if (ua.includes('windows nt 6.2')) return 'Windows 8';
    if (ua.includes('windows nt 6.1')) return 'Windows 7';
    return 'Windows';
  }
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';

  return 'unknown';
};

/**
 * Detect browser from user agent
 */
const detectBrowser = (userAgent) => {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';

  return 'unknown';
};

module.exports = {
  extractDeviceInfo,
  detectDeviceType,
  detectPlatform,
  detectOS,
  detectBrowser,
};





