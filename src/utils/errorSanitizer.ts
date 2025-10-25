/**
 * Error Sanitization Utility
 * Prevents information leakage by mapping internal errors to safe user-facing messages
 */

interface ErrorMapping {
  [key: string]: string;
}

// Map database error codes to safe messages
const dbErrorCodes: ErrorMapping = {
  '23505': 'duplicate_entry',
  '23503': 'invalid_reference',
  '23502': 'required_field_missing',
  '23514': 'constraint_violation',
  '23P01': 'resource_conflict',
  '42P01': 'resource_not_found',
  '42703': 'invalid_field',
  '22P02': 'invalid_format',
};

// Map application error types to safe messages
const appErrorTypes: ErrorMapping = {
  'invalid_lock_token': 'Time slot lock has expired. Please select your time again.',
  'slot_conflict': 'This time slot is no longer available. Please select another time.',
  'rate_limit_exceeded': 'Too many requests. Please try again in a few minutes.',
  'invalid_credentials': 'Invalid credentials provided.',
  'unauthorized': 'You do not have permission to perform this action.',
  'payment_failed': 'Payment processing failed. Please try again.',
  'booking_not_found': 'Booking not found or has been cancelled.',
  'venue_not_found': 'Venue not found.',
  'service_unavailable': 'This service is currently unavailable.',
};

export interface SanitizedError {
  code: string;
  message: string;
  statusCode: number;
  requestId?: string;
}

/**
 * Sanitizes an error to prevent internal information leakage
 * 
 * @param error - The error object to sanitize
 * @param requestId - Optional request ID for tracking
 * @returns Sanitized error object safe for client response
 */
export function sanitizeError(error: any, requestId?: string): SanitizedError {
  // Handle database errors
  if (error.code && dbErrorCodes[error.code]) {
    return {
      code: dbErrorCodes[error.code],
      message: getGenericMessage(dbErrorCodes[error.code]),
      statusCode: getStatusCode(error.code),
      requestId,
    };
  }

  // Handle known application errors
  if (error.message && appErrorTypes[error.message]) {
    return {
      code: error.message,
      message: appErrorTypes[error.message],
      statusCode: getAppErrorStatusCode(error.message),
      requestId,
    };
  }

  // For unknown errors, return generic message
  // NEVER expose error.message, error.stack, or error.detail to clients
  console.error('[INTERNAL ERROR]', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    requestId,
  });

  return {
    code: 'internal_error',
    message: 'An unexpected error occurred. Please try again later.',
    statusCode: 500,
    requestId,
  };
}

/**
 * Gets a generic user-friendly message for an error code
 */
function getGenericMessage(code: string): string {
  const messages: ErrorMapping = {
    'duplicate_entry': 'This entry already exists.',
    'invalid_reference': 'Referenced item not found.',
    'required_field_missing': 'Required information is missing.',
    'constraint_violation': 'Invalid data provided.',
    'resource_conflict': 'Resource is currently unavailable.',
    'resource_not_found': 'Requested resource not found.',
    'invalid_field': 'Invalid field provided.',
    'invalid_format': 'Invalid data format.',
  };

  return messages[code] || 'An error occurred processing your request.';
}

/**
 * Maps database error codes to HTTP status codes
 */
function getStatusCode(code: string): number {
  const statusCodes: { [key: string]: number } = {
    '23505': 409, // Conflict
    '23503': 400, // Bad Request
    '23502': 400, // Bad Request
    '23514': 400, // Bad Request
    '23P01': 409, // Conflict
    '42P01': 404, // Not Found
    '42703': 400, // Bad Request
    '22P02': 400, // Bad Request
  };

  return statusCodes[code] || 500;
}

/**
 * Maps application error types to HTTP status codes
 */
function getAppErrorStatusCode(errorType: string): number {
  const statusCodes: { [key: string]: number } = {
    'invalid_lock_token': 410, // Gone
    'slot_conflict': 409, // Conflict
    'rate_limit_exceeded': 429, // Too Many Requests
    'invalid_credentials': 401, // Unauthorized
    'unauthorized': 403, // Forbidden
    'payment_failed': 402, // Payment Required
    'booking_not_found': 404, // Not Found
    'venue_not_found': 404, // Not Found
    'service_unavailable': 503, // Service Unavailable
  };

  return statusCodes[errorType] || 500;
}

/**
 * Creates a safe JSON error response for edge functions
 * 
 * @param error - The error to sanitize
 * @param requestId - Optional request ID for tracking
 * @param corsHeaders - CORS headers to include in response
 * @returns Response object with sanitized error
 */
export function createErrorResponse(
  error: any,
  requestId?: string,
  corsHeaders: Record<string, string> = {}
): Response {
  const sanitized = sanitizeError(error, requestId);

  return new Response(
    JSON.stringify({
      success: false,
      error: sanitized.message,
      code: sanitized.code,
      reqId: sanitized.requestId,
    }),
    {
      status: sanitized.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}
