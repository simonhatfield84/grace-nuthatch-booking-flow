// Shared API response helper for consistent error/success shapes
export type ErrorCode =
  | 'venue_not_found' | 'service_not_found' | 'invalid_input'
  | 'missing_lock_token' | 'invalid_lock' | 'db_error'
  | 'rate_limited' | 'unauthorized' | 'forbidden' | 'not_found'
  | 'duplicate_entry' | 'payment_error' | 'stripe_error'
  | 'missing_service_id' | 'invalid_service_id' | 'party_size_invalid'
  | 'server_error';

export const ok = <T>(data: T, reqId?: string) => ({
  ok: true,
  data,
  ...(reqId ? { reqId } : {})
});

export const err = (
  code: ErrorCode,
  message: string,
  reqId?: string,
  extra?: Record<string, any>
) => ({
  ok: false,
  code,
  message,
  ...(reqId ? { reqId } : {}),
  ...(extra || {})
});

export const jsonResponse = (
  body: any,
  status = 200,
  headers: Record<string, string> = {}
) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    ...headers
  }
});
