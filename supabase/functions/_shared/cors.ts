/**
 * CORS Configuration for Supabase Edge Functions
 * Provides dynamic origin validation for better security
 */

const allowedOriginPatterns = [
  /^https:\/\/.*\.lovableproject\.com$/,
  /^https:\/\/graceful-kangaroo-afa6b6\.netlify\.app$/,
  /^https:\/\/grace-os\.co\.uk$/,
  /^https:\/\/www\.grace-os\.co\.uk$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string): boolean {
  return allowedOriginPatterns.some(pattern => pattern.test(origin));
}

/**
 * Get CORS headers with dynamic origin validation
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  
  // If no origin header or not allowed, use first allowed pattern as fallback
  const allowedOrigin = origin && isOriginAllowed(origin) 
    ? origin 
    : 'https://graceful-kangaroo-afa6b6.netlify.app';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sentry-trace, baggage',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, DELETE, PUT, PATCH',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: getCorsHeaders(req) 
    });
  }
  return null;
}

/**
 * Legacy static CORS headers (deprecated, use getCorsHeaders instead)
 * @deprecated Use getCorsHeaders(req) for dynamic origin validation
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sentry-trace, baggage',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};
