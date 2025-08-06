// Enhanced client-side security utilities with comprehensive validation
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
    
    // Adjust limits based on threat level - more aggressive than before
    const adjustedMax = threatLevel === 'high' ? Math.floor(config.maxRequests * 0.2) : 
                      threatLevel === 'medium' ? Math.floor(config.maxRequests * 0.5) : 
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

  static clearLimits(): void {
    this.limits.clear();
  }
}

// Enhanced input sanitization functions
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .slice(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  const cleanEmail = email.trim().toLowerCase().slice(0, 254);
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Invalid email format');
  }
  return cleanEmail;
}

export function sanitizePhone(phone: string): string {
  const cleanPhone = phone.replace(/[^\d\s\-\+\(\)]/g, '').trim().slice(0, 20);
  // Basic phone validation - at least 7 digits
  const phoneDigits = cleanPhone.replace(/\D/g, '');
  if (phoneDigits.length < 7) {
    throw new Error('Invalid phone number format');
  }
  return cleanPhone;
}

export function sanitizeName(name: string): string {
  const cleanName = name.trim().replace(/[<>]/g, '').slice(0, 100);
  if (cleanName.length < 1) {
    throw new Error('Name is required');
  }
  // Only allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(cleanName)) {
    throw new Error('Name contains invalid characters');
  }
  return cleanName;
}

export function validateVenueData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    if (!data.name || data.name.length < 2) {
      errors.push('Venue name must be at least 2 characters');
    }
    
    if (!data.slug || !/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push('Venue slug must contain only lowercase letters, numbers, and hyphens');
    }
    
    if (data.email) {
      sanitizeEmail(data.email);
    } else {
      errors.push('Valid email is required');
    }
    
    if (data.phone && data.phone.trim()) {
      try {
        sanitizePhone(data.phone);
      } catch (error) {
        errors.push('Invalid phone number format');
      }
    }
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Validation error');
  }
  
  return { isValid: errors.length === 0, errors };
}

export function detectThreatLevel(userAgent: string, referer?: string, ip?: string): 'low' | 'medium' | 'high' {
  let threatScore = 0;
  
  // High threat indicators
  if (
    userAgent.includes('bot') ||
    userAgent.includes('crawler') ||
    userAgent.includes('spider') ||
    userAgent.includes('scraper') ||
    userAgent.length < 10
  ) {
    threatScore += 3;
  }
  
  // Medium threat indicators
  if (
    userAgent.includes('curl') || 
    userAgent.includes('wget') ||
    userAgent.includes('python') ||
    userAgent.includes('node') ||
    userAgent.includes('postman')
  ) {
    threatScore += 2;
  }
  
  // Suspicious referer patterns
  if (referer && !referer.includes(window.location.hostname)) {
    threatScore += 1;
  }
  
  // No referer at all (could be suspicious)
  if (!referer) {
    threatScore += 1;
  }
  
  // Check for headless browser indicators
  if (
    !window.navigator.webdriver === undefined ||
    window.navigator.languages === undefined ||
    window.outerWidth === 0
  ) {
    threatScore += 2;
  }
  
  if (threatScore >= 4) return 'high';
  if (threatScore >= 2) return 'medium';
  return 'low';
}

// Enhanced password strength validation
export function validatePasswordStrength(password: string): { 
  isValid: boolean; 
  score: number; 
  feedback: string[] 
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  else feedback.push('Password must be at least 8 characters long');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Password must contain lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Password must contain uppercase letters');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('Password must contain numbers');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 2;
  else feedback.push('Password must contain special characters');
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }
  
  if (/^(.)\1*$/.test(password)) {
    score = 0;
    feedback.push('Password cannot be all the same character');
  }
  
  // Check for sequential patterns
  if (/123|abc|qwe/i.test(password)) {
    score -= 1;
    feedback.push('Avoid sequential patterns');
  }
  
  return {
    isValid: score >= 5,
    score: Math.max(0, score),
    feedback
  };
}

// Content Security Policy helper
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Enhanced secure session storage
export class SecureStorage {
  private static encrypt(data: string, key: string): string {
    // Simple XOR encryption for client-side (not cryptographically secure)
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }
  
  private static decrypt(encryptedData: string, key: string): string {
    const data = atob(encryptedData);
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }
  
  static setSecureItem(key: string, value: string): void {
    try {
      const encryptionKey = sessionStorage.getItem('_sk') || Math.random().toString(36);
      if (!sessionStorage.getItem('_sk')) {
        sessionStorage.setItem('_sk', encryptionKey);
      }
      
      const encrypted = this.encrypt(value, encryptionKey);
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage set failed:', error);
    }
  }
  
  static getSecureItem(key: string): string | null {
    try {
      const encryptionKey = sessionStorage.getItem('_sk');
      if (!encryptionKey) return null;
      
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      
      return this.decrypt(encrypted, encryptionKey);
    } catch (error) {
      console.error('Secure storage get failed:', error);
      return null;
    }
  }
  
  static clearSecureStorage(): void {
    try {
      sessionStorage.removeItem('_sk');
    } catch (error) {
      console.error('Secure storage clear failed:', error);
    }
  }
}

// Security event logger helper
export function logClientSecurityEvent(eventType: string, details: Record<string, any> = {}) {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...details
  };
  
  // Store in secure session storage for potential server sync
  try {
    const existingEvents = SecureStorage.getSecureItem('security_events');
    const events = existingEvents ? JSON.parse(existingEvents) : [];
    events.push(event);
    
    // Keep only last 50 events
    if (events.length > 50) {
      events.splice(0, events.length - 50);
    }
    
    SecureStorage.setSecureItem('security_events', JSON.stringify(events));
  } catch (error) {
    console.error('Failed to log client security event:', error);
  }
}
