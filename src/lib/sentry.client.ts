import * as Sentry from "@sentry/react";

// Initialize Sentry for the Grace public booking widget
Sentry.init({
  dsn: "https://f0556f88a28288ba4408bd3c2c226e20@o4510263265329152.ingest.de.sentry.io/4510263281516624",
  
  // Environment configuration
  environment: import.meta.env.MODE === "production" ? "production" : "staging",
  
  // Debug mode - shows detailed SDK logs in console
  debug: true,
  
  // Privacy: Disable automatic PII collection
  sendDefaultPii: false,
  
  // Integrations
  integrations: [
    // Performance monitoring
    Sentry.browserTracingIntegration(),
    
    // Session replay for debugging
    Sentry.replayIntegration({
      // Privacy settings for replay
      maskAllText: false, // We'll manually redact PII in beforeSend
      blockAllMedia: true, // Block images/videos
      maskAllInputs: true, // Mask all form inputs by default
    })
  ],
  
  // Sampling rates
  tracesSampleRate: 0.05,           // 5% of transactions for performance
  replaysSessionSampleRate: 0.005,  // 0.5% of normal sessions
  replaysOnErrorSampleRate: 1.0,    // 100% of error sessions (always record on error)
  
  // Enable console logs integration
  enableLogs: true,
  
  // PII Redaction: Remove sensitive data before sending to Sentry
  beforeSend(event) {
    // Helper function to redact emails and phone numbers
    const redact = (value: any): any => {
      if (typeof value === 'string') {
        return value
          // Redact email addresses
          .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
          // Redact phone numbers (various formats)
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

    // Redact breadcrumbs (user actions, console logs, network requests)
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
        ...breadcrumb,
        message: redact(breadcrumb.message),
        data: redact(breadcrumb.data),
      }));
    }

    // Remove user PII, keep only anonymous ID
    if (event.user) {
      event.user = {
        id: event.user.id ?? undefined, // Keep anonymous session ID only
      };
    }

    // Remove sensitive headers and cookies
    if (event.request) {
      delete event.request.headers;
      delete event.request.cookies;
    }

    // Redact extra context data
    if (event.extra) {
      event.extra = redact(event.extra);
    }

    // Redact exception values
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map(exception => ({
        ...exception,
        value: redact(exception.value),
      }));
    }

    return event;
  },

  // Ignore errors from browser extensions
  denyUrls: [
    /extensions\//i,
    /chrome-extension:\/\//i,
    /moz-extension:\/\//i,
  ],

  // Ignore common third-party errors
  ignoreErrors: [
    // Browser extension errors
    'top.GLOBALS',
    'chrome.runtime',
    // Network errors that are not actionable
    'NetworkError',
    'Failed to fetch',
    // ResizeObserver loop errors (common, not actionable)
    'ResizeObserver loop limit exceeded',
  ],
});

// Log initialization in development
if (import.meta.env.DEV) {
  console.log('🔍 Sentry initialized for Grace booking widget', {
    environment: import.meta.env.MODE,
    dsn: 'https://...o4510263281516624',
  });
  
  // Verify DSN is parsed correctly
  const client = Sentry.getClient();
  const dsn = client?.getDsn();
  console.log('🔍 Sentry DSN parsed:', {
    projectId: dsn?.projectId,
    host: dsn?.host,
    publicKey: dsn?.publicKey,
  });
}

// Dev-only: Send test error to verify Sentry integration
if (import.meta.env.MODE !== "production") {
  // Send a test error 2s after load so init has finished
  setTimeout(() => {
    try {
      throw new Error("Grace Widget Sentry verification error");
    } catch (e) {
      // Both throw (unhandled) and capture (handled) to be safe
      Sentry.captureException(e);
      // Re-throw to ensure it shows as an unhandled error too
      setTimeout(() => { throw e; }, 0);
    }
  }, 2000);
}
