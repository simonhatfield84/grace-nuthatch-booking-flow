// Export CORS headers for convenience
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
};

export interface SanitizedError {
  code: string;
  message: string;
  reqId?: string;
}

const ERROR_MAP: Record<string, string> = {
  // PostgreSQL error codes
  '23505': 'duplicate_entry',
  '23503': 'invalid_reference',
  '23P01': 'serialization_conflict',
  '23514': 'constraint_violation',
  '42P01': 'resource_not_found',
  '42501': 'insufficient_privilege',
  
  // Application error codes
  'PGRST116': 'resource_not_found',
  'PGRST301': 'resource_not_found',
};

export function sanitizeError(error: any, requestId?: string): SanitizedError {
  const code = error?.code || error?.error_code || 'unknown';
  
  return {
    code: ERROR_MAP[code] || 'request_failed',
    message: 'Something went wrong. Please try again or contact support.',
    reqId: requestId || crypto.randomUUID()
  };
}

export function createErrorResponse(
  error: any, 
  status: number = 500
): Response {
  const sanitized = sanitizeError(error);
  
  // Log full error details server-side only
  console.error('[INTERNAL ERROR]', {
    status,
    reqId: sanitized.reqId,
    code: error?.code,
    message: error?.message,
    stack: error?.stack,
    details: error
  });
  
  return new Response(
    JSON.stringify(sanitized),
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    }
  );
}
