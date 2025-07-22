
// Input sanitization utilities for enhanced security
import DOMPurify from 'dompurify';

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  removeControlChars?: boolean;
}

export class InputSanitizer {
  // Sanitize general text input
  static sanitizeText(input: string, options: SanitizationOptions = {}): string {
    if (!input || typeof input !== 'string') return '';
    
    const {
      maxLength = 1000,
      trimWhitespace = true,
      removeControlChars = true,
      allowHtml = false
    } = options;

    let sanitized = input;

    // Trim whitespace
    if (trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Remove control characters
    if (removeControlChars) {
      sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    }

    // Handle HTML content
    if (!allowHtml) {
      // Strip all HTML tags for plain text
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      // Decode HTML entities
      sanitized = this.decodeHtmlEntities(sanitized);
    } else {
      // Sanitize HTML while preserving safe tags
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
        ALLOWED_ATTR: []
      });
    }

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  // Sanitize email addresses
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    
    return email
      .trim()
      .toLowerCase()
      .replace(/[^\w@.-]/g, '') // Only allow word chars, @, ., -
      .slice(0, 254); // RFC 5321 limit
  }

  // Sanitize phone numbers
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    
    return phone
      .replace(/[^\d\s\-\+\(\)]/g, '') // Only allow digits and common phone chars
      .trim()
      .slice(0, 20);
  }

  // Sanitize names (guest names, venue names, etc.)
  static sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return '';
    
    return name
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML brackets
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .slice(0, 100); // Reasonable name length limit
  }

  // Sanitize rich text content (descriptions, notes, etc.)
  static sanitizeRichText(content: string): string {
    if (!content || typeof content !== 'string') return '';
    
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
      ],
      ALLOWED_ATTR: ['class'],
      ALLOW_DATA_ATTR: false
    });
  }

  // Sanitize search queries
  static sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') return '';
    
    return query
      .trim()
      .replace(/[<>'"]/g, '') // Remove potential injection chars
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .slice(0, 200); // Reasonable search query length
  }

  // Private helper to decode HTML entities
  private static decodeHtmlEntities(str: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  }

  // Validate and sanitize booking reference
  static sanitizeBookingReference(ref: string): string {
    if (!ref || typeof ref !== 'string') return '';
    
    return ref
      .trim()
      .replace(/[^A-Z0-9\-]/g, '') // Only allow uppercase letters, numbers, and hyphens
      .slice(0, 20);
  }

  // Sanitize notes with length limit
  static sanitizeNotes(notes: string): string {
    if (!notes || typeof notes !== 'string') return '';
    
    return this.sanitizeText(notes, {
      maxLength: 2000,
      allowHtml: false,
      trimWhitespace: true,
      removeControlChars: true
    });
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number }>();

  static checkLimit(
    identifier: string, 
    maxRequests: number, 
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `${identifier}-${windowMs}`;
    
    let limit = this.limits.get(key);
    
    if (!limit || now >= limit.resetTime) {
      limit = { count: 1, resetTime: now + windowMs };
      this.limits.set(key, limit);
      return { allowed: true, remaining: maxRequests - 1, resetTime: limit.resetTime };
    }

    if (limit.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: limit.resetTime };
    }

    limit.count++;
    this.limits.set(key, limit);
    return { allowed: true, remaining: maxRequests - limit.count, resetTime: limit.resetTime };
  }

  static getClientIdentifier(userAgent: string, ip?: string): string {
    const safeIp = ip || 'unknown';
    return `${safeIp}-${userAgent.slice(0, 50)}`;
  }
}

// Security validation utilities
export class SecurityValidator {
  // Check for suspicious patterns in input
  static detectSuspiciousContent(input: string): { suspicious: boolean; reason?: string } {
    if (!input || typeof input !== 'string') return { suspicious: false };

    const suspiciousPatterns = [
      /javascript:/i,
      /<script/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /vbscript:/i,
      /expression\s*\(/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        return { suspicious: true, reason: 'Potential XSS attempt detected' };
      }
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /';\s*(drop|delete|insert|update)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return { suspicious: true, reason: 'Potential SQL injection attempt detected' };
      }
    }

    return { suspicious: false };
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate phone format
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
    return phoneRegex.test(phone);
  }

  // Check password strength
  static checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    return {
      score,
      feedback,
      isStrong: score >= 4
    };
  }
}
