/**
 * Location service to fetch geographical information from IP addresses
 */

interface LocationData {
  ip: string;
  city: string;
  region: string; // state/province
  country: string;
  countryCode: string;
  timezone: string;
  isp?: string;
  org?: string;
  lat?: number;
  lon?: number;
}

interface IPApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

// Simple in-memory cache for location data (1 hour TTL)
const locationCache = new Map<string, { data: LocationData; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export class LocationService {
  /**
   * Get location data from IP address using ip-api.com (free service)
   * Falls back to minimal data if service is unavailable
   * Includes caching to reduce API calls
   */
  static async getLocationFromIP(ipAddress: string): Promise<LocationData> {
    // Check cache first
    const cached = locationCache.get(ipAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached location for IP: ${ipAddress}`);
      return cached.data;
    }

    // Default fallback data
    const fallbackData: LocationData = {
      ip: ipAddress,
      city: 'Unknown',
      region: 'Unknown',
      country: 'Unknown',
      countryCode: 'Unknown',
      timezone: 'Unknown'
    };

    try {
      // Skip location lookup for local/private IPs
      if (this.isPrivateIP(ipAddress)) {
        console.log(`Skipping location lookup for private IP: ${ipAddress}`);
        const localData = {
          ...fallbackData,
          city: 'Local Network',
          region: 'Private',
          country: 'Local',
          countryCode: 'LOCAL'
        };
        // Cache local IP results too
        locationCache.set(ipAddress, { data: localData, timestamp: Date.now() });
        return localData;
      }

      console.log(`Fetching location data for IP: ${ipAddress}`);

      // Use ip-api.com free service (15 requests per minute limit)
      const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
        method: 'GET',
        headers: {
          'User-Agent': 'AuthApp/1.0',
        },
        // Set timeout for the request (reduced from 5s to 3s)
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      if (!response.ok) {
        console.warn(`IP geolocation service returned ${response.status} for IP ${ipAddress}`);
        // Cache fallback data to avoid repeated failed lookups
        locationCache.set(ipAddress, { data: fallbackData, timestamp: Date.now() });
        return fallbackData;
      }

      const data: IPApiResponse = await response.json();
      console.log(`Location response for ${ipAddress}:`, data);

      if (data.status === 'fail') {
        console.warn('IP geolocation lookup failed:', data);
        // Cache fallback data
        locationCache.set(ipAddress, { data: fallbackData, timestamp: Date.now() });
        return fallbackData;
      }

      const locationResult = {
        ip: data.query || ipAddress,
        city: data.city || 'Unknown',
        region: data.regionName || data.region || 'Unknown',
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'Unknown',
        timezone: data.timezone || 'Unknown',
        isp: data.isp,
        org: data.org,
        lat: data.lat,
        lon: data.lon
      };

      console.log(`Successfully got location for ${ipAddress}:`, locationResult);
      
      // Cache the successful result
      locationCache.set(ipAddress, { data: locationResult, timestamp: Date.now() });
      
      return locationResult;

    } catch (error) {
      console.error(`Error fetching location data for IP ${ipAddress}:`, error);
      // Cache fallback data to avoid repeated failures
      locationCache.set(ipAddress, { data: fallbackData, timestamp: Date.now() });
      return fallbackData;
    }
  }

  /**
   * Check if an IP address is private/local
   */
  private static isPrivateIP(ip: string): boolean {
    if (!ip || ip === 'localhost' || ip === '::1') return true;
    
    // IPv4 private ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);
    
    if (match) {
      const octets = match.slice(1).map(Number);
      const [a, b] = octets;
      
      // 10.0.0.0/8
      if (a === 10) return true;
      
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return true;
      
      // 192.168.0.0/16
      if (a === 192 && b === 168) return true;
      
      // 127.0.0.0/8 (localhost)
      if (a === 127) return true;
    }

    return false;
  }

  /**
   * Parse browser information from User-Agent string
   */
  static parseBrowserInfo(userAgent: string): {
    browser: string;
    os: string;
    device: string;
  } {
    if (!userAgent) {
      return {
        browser: 'Unknown Browser',
        os: 'Unknown OS',
        device: 'Unknown Device'
      };
    }

    const ua = userAgent.toLowerCase();
    
    // Detect browser
    let browser = 'Unknown Browser';
    if (ua.includes('edg/') || ua.includes('edge/')) {
      browser = 'Microsoft Edge';
    } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
      browser = 'Google Chrome';
    } else if (ua.includes('firefox/')) {
      browser = 'Mozilla Firefox';
    } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
      browser = 'Safari';
    } else if (ua.includes('opera/') || ua.includes('opr/')) {
      browser = 'Opera';
    }

    // Detect OS
    let os = 'Unknown OS';
    if (ua.includes('windows nt')) {
      if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
      else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
      else if (ua.includes('windows nt 6.2')) os = 'Windows 8';
      else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
      else os = 'Windows';
    } else if (ua.includes('mac os x')) {
      os = 'macOS';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    } else if (ua.includes('android')) {
      os = 'Android';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
    }

    // Detect device type
    let device = 'Desktop';
    if (ua.includes('mobile') || ua.includes('android')) {
      device = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      device = 'Tablet';
    }

    return { browser, os, device };
  }

  /**
   * Format location data for display in emails
   */
  static formatLocationForEmail(location: LocationData, browserInfo: ReturnType<typeof LocationService.parseBrowserInfo>): string {
    const parts = [];
    
    if (location.city !== 'Unknown') parts.push(location.city);
    if (location.region !== 'Unknown') parts.push(location.region);
    if (location.country !== 'Unknown') parts.push(location.country);
    
    const locationStr = parts.length > 0 ? parts.join(', ') : 'Unknown Location';
    
    return `${locationStr} (${browserInfo.browser} on ${browserInfo.os})`;
  }
}
