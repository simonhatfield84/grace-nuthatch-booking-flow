type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  reqId?: string;
  venueId?: string;
  bookingId?: number;
  userId?: string;
  [key: string]: any;
}

interface LoggerConfig {
  environment: 'development' | 'production' | 'staging';
  enabledLevels: Set<LogLevel>;
  redactPII: boolean;
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

// ========== LOGGER CONFIGURATION ==========

const isBrowser = typeof window !== 'undefined';
const isProduction = isBrowser 
  ? import.meta.env.MODE === 'production'
  : false;

const config: LoggerConfig = {
  environment: isProduction ? 'production' : 'development',
  enabledLevels: isProduction 
    ? new Set<LogLevel>(['warn', 'error']) 
    : new Set<LogLevel>(['debug', 'info', 'warn', 'error']),
  redactPII: true, // Always redact PII
};

// ========== BROWSER LOGGER ==========

function browserLog(level: LogLevel, message: string, context?: LogContext) {
  if (!config.enabledLevels.has(level)) return;

  const emoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  }[level];

  const prefix = context?.reqId 
    ? `[${context.reqId.substring(0, 8)}]`
    : '';

  const redactedContext = config.redactPII && context 
    ? redact(context) 
    : context;

  // Use native console with appropriate method
  const consoleMethod = console[level] || console.log;
  
  if (redactedContext && Object.keys(redactedContext).length > 0) {
    consoleMethod(`${emoji} ${prefix} ${message}`, redactedContext);
  } else {
    consoleMethod(`${emoji} ${prefix} ${message}`);
  }
}

// ========== LOGGER API ==========

export const logger = {
  /**
   * Debug-level logging (development only)
   * Use for: Detailed debugging, variable inspection
   */
  debug(message: string, context?: LogContext) {
    browserLog('debug', message, context);
  },

  /**
   * Info-level logging (development only in browser)
   * Use for: Normal application flow, successful operations
   */
  info(message: string, context?: LogContext) {
    browserLog('info', message, context);
  },

  /**
   * Warning-level logging (always logged)
   * Use for: Unexpected but handled situations, deprecations
   */
  warn(message: string, context?: LogContext) {
    browserLog('warn', message, context);
  },

  /**
   * Error-level logging (always logged)
   * Use for: Errors, exceptions, failures
   */
  error(message: string, context?: LogContext) {
    browserLog('error', message, context);
  },

  /**
   * Manually redact PII from any value (exported for convenience)
   */
  redact,
};

export type { LogContext, LogLevel };
