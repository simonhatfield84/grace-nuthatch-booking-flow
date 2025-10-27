/**
 * Venue utility functions
 */

/**
 * Extract venue slug from URL or return default
 */
export function getVenueSlug(defaultSlug = 'the-nuthatch'): string {
  if (typeof window === 'undefined') return defaultSlug;
  
  const path = window.location.pathname;
  const match = path.match(/\/booking\/([^/?]+)/);
  return match ? match[1] : defaultSlug;
}

/**
 * Build booking URL for a venue
 */
export function buildBookingUrl(venueSlug: string, params?: Record<string, string>): string {
  let url = `/booking/${venueSlug}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
}

/**
 * Validate venue slug format
 */
export function isValidVenueSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}
