type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  reqId?: string;
  venueId?: string;
  bookingId?: number;
  userId?: string;
  [key: string]: any;
}

// ========== PII REDACTION ==========

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /\+?\d[\d\s().-]{7,}\d/g;
const CARD_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

/**
 * Recursively redact PII from objects, arrays, and strings
 */
export function redact(value: any): any {
  if (value === null || value === undefined) return value;

  // String redaction
  if (typeof value === 'string') {
    return value
      .replace(EMAIL_REGEX, '[email]')
      .replace(PHONE_REGEX, '[phone]')
      .replace(CARD_REGEX, '[card]');
  }

  // Array redaction
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  // Object redaction
  if (typeof value === 'object') {
    const redacted: any = {};
    for (const key in value) {
      // Also redact known PII keys by name
      if (['email', 'phone', 'telephone', 'mobile', 'card', 'cardNumber'].includes(key.toLowerCase())) {
        redacted[key] = `[${key}]`;
      } else {
        redacted[key] = redact(value[key]);
      }
    }
    return redacted;
  }

  return value;
}

// ========== EDGE FUNCTION LOGGER (Structured JSON) ==========

function edgeLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    level,
    message: redact(message),
    ...(context && { context: redact(context) }),
  };

  // Always log in edge functions (let Supabase handle filtering)
  // Use console.log for structured JSON (Supabase parses this)
  console.log(JSON.stringify(logEntry));
}

// ========== LOGGER API ==========

export const logger = {
  /**
   * Debug-level logging
   * Use for: Detailed debugging, variable inspection
   */
  debug(message: string, context?: LogContext) {
    edgeLog('debug', message, context);
  },

  /**
   * Info-level logging
   * Use for: Normal application flow, successful operations
   */
  info(message: string, context?: LogContext) {
    edgeLog('info', message, context);
  },

  /**
   * Warning-level logging
   * Use for: Unexpected but handled situations, deprecations
   */
  warn(message: string, context?: LogContext) {
    edgeLog('warn', message, context);
  },

  /**
   * Error-level logging
   * Use for: Errors, exceptions, failures
   */
  error(message: string, context?: LogContext) {
    edgeLog('error', message, context);
  },

  /**
   * Manually redact PII from any value (exported for convenience)
   */
  redact,
};

export type { LogContext, LogLevel };
