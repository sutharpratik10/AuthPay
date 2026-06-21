import { UAParser } from 'ua-parser-js';

export function parseUserAgent(userAgentString: string | null | undefined) {
  if (!userAgentString) {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      device: 'Unknown Device',
    };
  }

  const parser = new UAParser(userAgentString);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  let deviceType = 'Desktop';
  if (device.type === 'mobile') deviceType = 'Mobile';
  else if (device.type === 'tablet') deviceType = 'Tablet';
  else if (device.type === 'smarttv') deviceType = 'Smart TV';
  else if (device.type === 'console') deviceType = 'Console';
  else if (device.type === 'wearable') deviceType = 'Wearable';

  return {
    browser: `${browser.name || 'Unknown Browser'} ${browser.version || ''}`.trim(),
    os: `${os.name || 'Unknown OS'} ${os.version || ''}`.trim(),
    device: device.vendor || device.model ? `${device.vendor || ''} ${device.model || ''}`.trim() : deviceType,
  };
}
