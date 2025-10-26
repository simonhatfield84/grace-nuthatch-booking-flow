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
    message: 'An error occurred. Please contact support if this persists.',
    reqId: requestId || crypto.randomUUID()
  };
}

export function createErrorResponse(
  error: any, 
  status: number = 500,
  corsHeaders: Record<string, string> = {}
): Response {
  const sanitized = sanitizeError(error);
  
  // Log full error server-side only
  console.error('[ERROR]', {
    reqId: sanitized.reqId,
    fullError: error,
    stack: error?.stack,
    code: error?.code
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
