/**
 * Utility functions for formatting data in the Weather App
 * Centralized location for all formatting logic
 */

/**
 * Converts a timezone identifier to a short abbreviation
 * @param timezone - IANA timezone identifier (e.g., "Asia/Jakarta", "Europe/London")
 * @returns Short timezone abbreviation (e.g., "WIB", "GMT+7", "BST")
 */
export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    return tzPart ? tzPart.value : ''; // e.g., "BST", "GMT+7", "WIB"
  } catch (error) {
    console.error("Failed to get timezone abbreviation:", error);
    return ''; // Return an empty string on failure
  }
}

/**
 * Converts a timezone offset in seconds to a GMT+/-X format abbreviation
 * @param offsetSeconds - Timezone offset in seconds from UTC
 * @returns GMT offset string (e.g., "GMT+7", "GMT-5", "GMT")
 */
export function formatTimezoneOffset(offsetSeconds: number): string {
  const offsetHours = offsetSeconds / 3600;
  
  if (offsetHours === 0) {
    return 'GMT';
  }
  
  const sign = offsetHours > 0 ? '+' : '-';
  const absHours = Math.abs(offsetHours);
  
  // Handle non-integer hour offsets (e.g., GMT+5:30)
  if (absHours % 1 !== 0) {
    const hours = Math.floor(absHours);
    const minutes = Math.round((absHours % 1) * 60);
    return `GMT${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return `GMT${sign}${Math.abs(offsetHours)}`;
}