import * as Sentry from "https://esm.sh/@sentry/deno@8.40.0";

// Initialize Sentry for Deno edge functions
// Call this once at the top of each edge function module
export function initSentry() {
  Sentry.init({
    dsn: "https://f0556f88a28288ba4408bd3c2c226e20@o4510263265329152.ingest.de.sentry.io/4510263281516624",
    environment: Deno.env.get("DENO_ENV") === "production" ? "production" : "staging",
    
    // Higher sample rate for edge functions (10% vs 5% browser)
    tracesSampleRate: 0.1,
    
    // Deno-specific integrations
    integrations: [
      Sentry.denoContextIntegration(),
    ],
    
    // Privacy: Disable automatic PII collection
    sendDefaultPii: false,
    
    // PII Redaction for edge functions
    beforeSend(event) {
      const redact = (value: any): any => {
        if (typeof value === 'string') {
          return value
            .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
            .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]');
        }
        if (typeof value === 'object' && value !== null) {
          const redacted: any = Array.isArray(value) ? [] : {};
          for (const key in value) {
            redacted[key] = redact(value[key]);
          }
          return redacted;
        }
        return value;
      };

      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          message: redact(breadcrumb.message),
          data: redact(breadcrumb.data),
        }));
      }

      if (event.user) {
        event.user = {
          id: event.user.id ?? undefined,
        };
      }

      if (event.request) {
        delete event.request.headers;
        delete event.request.cookies;
      }

      if (event.extra) {
        event.extra = redact(event.extra);
      }

      if (event.exception?.values) {
        event.exception.values = event.exception.values.map(exception => ({
          ...exception,
          value: redact(exception.value),
        }));
      }

      return event;
    },
  });
}

/**
 * Wrapper for edge function handlers that:
 * 1. Continues trace from browser (via sentry-trace and baggage headers)
 * 2. Creates a transaction with the incoming trace context
 * 3. Generates a request ID for correlation
 * 4. Adds x-req-id header to response
 * 5. Captures exceptions with full context
 * 
 * Usage:
 * ```typescript
 * import { initSentry, withSentry } from '../_shared/sentry.ts';
 * 
 * initSentry();
 * 
 * const handler = withSentry(async (req, transaction, reqId) => {
 *   // Your handler logic
 *   const span = transaction.startChild({ op: 'db.query', description: 'Fetch venue' });
 *   // ... database call
 *   span.finish();
 *   
 *   return new Response(JSON.stringify(result), { status: 200 });
 * }, 'POST /your-endpoint');
 * 
 * serve(handler);
 * ```
 */
export function withSentry<T>(
  handler: (req: Request, transaction: Sentry.Transaction, reqId: string) => Promise<T>,
  operationName?: string
) {
  return async (req: Request): Promise<Response> => {
    const reqId = crypto.randomUUID().substring(0, 12);
    
    // Extract trace headers from browser request
    const sentryTraceHeader = req.headers.get("sentry-trace");
    const baggageHeader = req.headers.get("baggage");
    
    // Parse trace context to link with browser transaction
    const traceContext = sentryTraceHeader
      ? Sentry.continueTrace({ sentryTrace: sentryTraceHeader, baggage: baggageHeader })
      : undefined;
    
    // Start transaction (linked to browser if trace exists)
    const transaction = Sentry.startTransaction({
      name: operationName || new URL(req.url).pathname,
      op: "http.server",
      ...traceContext,
      tags: {
        reqId,
        path: new URL(req.url).pathname,
      },
    });
    
    Sentry.getCurrentScope().setSpan(transaction);
    
    try {
      const result = await handler(req, transaction, reqId);
      transaction.setStatus("ok");
      
      // If result is Response, add reqId header for correlation
      if (result instanceof Response) {
        const headers = new Headers(result.headers);
        headers.set("x-req-id", reqId);
        return new Response(result.body, {
          status: result.status,
          statusText: result.statusText,
          headers,
        });
      }
      
      return result as Response;
    } catch (error) {
      transaction.setStatus("internal_error");
      
      // Capture exception with full context
      Sentry.captureException(error, {
        tags: { reqId },
        contexts: {
          request: {
            url: req.url,
            method: req.method,
          },
        },
      });
      
      throw error;
    } finally {
      transaction.finish();
    }
  };
}
