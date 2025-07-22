// Client-side security utilities (no Supabase server imports)
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string) => string;
}

export class AdvancedRateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number; level: 'low' | 'medium' | 'high' }>();

  static async checkLimit(
    identifier: string, 
    config: RateLimitConfig,
    threatLevel: 'low' | 'medium' | 'high' = 'low'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = `${identifier}-${config.windowMs}`;
    
    // Adjust limits based on threat level
    const adjustedMax = threatLevel === 'high' ? Math.floor(config.maxRequests * 0.5) : 
                      threatLevel === 'medium' ? Math.floor(config.maxRequests * 0.75) : 
                      config.maxRequests;

    let limit = this.limits.get(key);
    
    if (!limit || now >= limit.resetTime) {
      limit = { 
        count: 1, 
        resetTime: now + config.windowMs,
        level: threatLevel 
      };
      this.limits.set(key, limit);
      return { allowed: true, remaining: adjustedMax - 1, resetTime: limit.resetTime };
    }

    if (limit.count >= adjustedMax) {
      return { allowed: false, remaining: 0, resetTime: limit.resetTime };
    }

    limit.count++;
    this.limits.set(key, limit);
    return { allowed: true, remaining: adjustedMax - limit.count, resetTime: limit.resetTime };
  }

  static getClientIdentifier(userAgent: string, ip?: string): string {
    const safeIp = ip || 'unknown';
    return `${safeIp}-${userAgent.slice(0, 50)}`;
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .slice(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 254);
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim().slice(0, 20);
}

export function detectThreatLevel(userAgent: string, referer?: string): 'low' | 'medium' | 'high' {
  // High threat indicators
  if (
    userAgent.includes('bot') ||
    userAgent.includes('crawler') ||
    userAgent.length < 10 ||
    (referer && !referer.includes('localhost') && !referer.includes('lovable.app'))
  ) {
    return 'high';
  }
  
  // Medium threat indicators
  if (userAgent.includes('curl') || userAgent.includes('wget')) {
    return 'medium';
  }
  
  return 'low';
}

// Additional security utilities for comprehensive protection
export class SecurityHeaders {
  // Content Security Policy configuration
  static getCSPDirectives(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ];
    return directives.join('; ');
  }

  // Set security headers (for server-side implementation)
  static getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.getCSPDirectives(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
    };
  }
}

// Audit logging for security events
export class SecurityAuditLogger {
  static async logSecurityEvent(
    eventType: string,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      details: {
        ...details,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security Audit]', auditEntry);
    }

    // In production, you would send this to your logging service
    // For now, we'll store in sessionStorage for debugging
    try {
      const existingLogs = JSON.parse(sessionStorage.getItem('security_audit') || '[]');
      existingLogs.push(auditEntry);
      
      // Keep only last 100 entries
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      sessionStorage.setItem('security_audit', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  static getAuditLogs(): any[] {
    try {
      return JSON.parse(sessionStorage.getItem('security_audit') || '[]');
    } catch {
      return [];
    }
  }

  static clearAuditLogs() {
    sessionStorage.removeItem('security_audit');
  }
}

// Session security utilities
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static activityTimer: NodeJS.Timeout | null = null;

  static initializeSessionMonitoring() {
    this.resetActivityTimer();
    
    // Monitor user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity.bind(this), true);
    });

    // Check for session tampering
    this.monitorSessionIntegrity();
  }

  private static handleUserActivity() {
    this.resetActivityTimer();
  }

  private static resetActivityTimer() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    this.activityTimer = setTimeout(() => {
      SecurityAuditLogger.logSecurityEvent('session_timeout', {
        reason: 'User inactivity',
        timeout: this.SESSION_TIMEOUT
      });
      
      // Trigger logout - this would be handled by your auth context
      window.dispatchEvent(new CustomEvent('session_timeout'));
    }, this.SESSION_TIMEOUT);
  }

  private static monitorSessionIntegrity() {
    // Check for session tampering every 5 minutes
    setInterval(() => {
      const sessionData = localStorage.getItem('supabase.auth.token');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          // Basic integrity check - you could expand this
          if (!session.access_token || !session.user) {
            SecurityAuditLogger.logSecurityEvent('session_tampered', {
              reason: 'Invalid session structure detected'
            }, 'high');
          }
        } catch (error) {
          SecurityAuditLogger.logSecurityEvent('session_parse_error', {
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'medium');
        }
      }
    }, 5 * 60 * 1000);
  }

  static cleanup() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
  }
}

// Browser fingerprinting detection
export class FingerprintDetector {
  static detectAutomation(): boolean {
    // Check for common automation indicators
    const indicators = [
      () => navigator.webdriver,
      () => window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect,
      () => window.callPhantom || window._phantom,
      () => window.Buffer,
      () => window.spawn,
      () => window.emit
    ];

    return indicators.some(check => {
      try {
        return check();
      } catch {
        return false;
      }
    });
  }

  static getFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Security fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
}
