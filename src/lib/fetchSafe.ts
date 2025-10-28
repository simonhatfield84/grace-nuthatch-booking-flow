import { supabase } from "@/integrations/supabase/client";
import * as Sentry from "@sentry/react";

interface FetchSafeOptions {
  service: string; // e.g. "check-availability"
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Wrapper around supabase.functions.invoke that:
 * 1. Creates Sentry spans for edge function calls
 * 2. Adds service name as span attribute
 * 3. Extracts and correlates reqId from response headers
 * 4. Creates breadcrumbs for debugging
 * 5. Captures errors with context
 * 
 * Usage:
 * ```typescript
 * const { data, error } = await invokeSafe('check-availability', {
 *   service: 'check-availability',
 *   body: { venueSlug, serviceId, date, partySize }
 * });
 * ```
 */
export async function invokeSafe<T = any>(
  functionName: string,
  options: FetchSafeOptions
): Promise<{ data: T | null; error: any }> {
  const span = Sentry.startInactiveSpan({
    op: "http.client",
    name: `POST /functions/v1/${functionName}`,
    attributes: {
      service: options.service,
      function: functionName,
    },
  });

  try {
    const result = await supabase.functions.invoke<T>(functionName, {
      body: options.body,
      headers: options.headers,
    });

    // Extract reqId from response headers for correlation
    // Note: Supabase client doesn't expose raw response headers easily,
    // but the edge function includes x-req-id which we can access if available
    const reqId = (result as any)?.headers?.get?.("x-req-id");
    if (reqId) {
      span.setAttribute("reqId", reqId);
      Sentry.getCurrentScope().setTag("lastReqId", reqId);
    }

    if (result.error) {
      span.setStatus({ code: 2 }); // ERROR status
      
      Sentry.addBreadcrumb({
        category: "api",
        message: `API error: ${options.service}`,
        level: "error",
        data: {
          service: options.service,
          function: functionName,
          error: result.error.message || String(result.error),
          reqId,
        },
      });
    } else {
      span.setStatus({ code: 1 }); // OK status
      
      Sentry.addBreadcrumb({
        category: "api",
        message: `API call: ${options.service}`,
        level: "info",
        data: {
          service: options.service,
          function: functionName,
          reqId,
        },
      });
    }

    return result;
  } catch (error) {
    span.setStatus({ code: 2 }); // ERROR status
    
    Sentry.captureException(error, {
      tags: {
        service: options.service,
        function: functionName,
      },
      contexts: {
        api: {
          service: options.service,
          function: functionName,
        },
      },
    });
    
    return { data: null, error };
  } finally {
    span.end();
  }
}
