export async function getLocationFromIP(ipAddress: string | null | undefined): Promise<string> {
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'localhost') {
    return 'Localhost / Unknown';
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
    if (!response.ok) {
      return 'Unknown Location';
    }

    const data = await response.json();
    if (data.status === 'success') {
      const parts: string[] = [];
      if (data.city) parts.push(data.city);
      if (data.regionName) parts.push(data.regionName);
      if (data.country) parts.push(data.country);

      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  } catch (error) {
    console.error('Failed to fetch location for IP:', ipAddress, error);
  }

  return 'Unknown Location';
}
