
export const securityValidation = {
  /**
   * Validates email format with additional security checks
   */
  validateEmail: (email: string): { isValid: boolean; reason?: string } => {
    if (!email) return { isValid: false, reason: 'Email is required' };
    
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, reason: 'Invalid email format' };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /[\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, // Zero-width characters
      /[<>]/g, // HTML tags
      /javascript:/i, // JavaScript protocol
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(email)) {
        return { isValid: false, reason: 'Email contains suspicious characters' };
      }
    }
    
    return { isValid: true };
  },

  /**
   * Enhanced password strength validation
   */
  validatePasswordStrength: (password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;
    
    if (!password) {
      return { isValid: false, score: 0, feedback: ['Password is required'] };
    }
    
    // Length check
    if (password.length >= 12) {
      score += 25;
    } else if (password.length >= 8) {
      score += 15;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }
    
    // Complexity checks
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Include uppercase letters');
    
    if (/[0-9]/.test(password)) score += 15;
    else feedback.push('Include numbers');
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;
    else feedback.push('Include special characters');
    
    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score -= 30;
      feedback.push('Avoid common passwords');
    }
    
    // Repetition check
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push('Avoid repeated characters');
    }
    
    const isValid = score >= 60 && feedback.length === 0;
    
    return { isValid, score: Math.max(0, Math.min(100, score)), feedback };
  },

  /**
   * Sanitizes user input to prevent XSS
   */
  sanitizeInput: (input: string): string => {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove JavaScript protocol
      .replace(/[\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, '') // Remove zero-width characters
      .trim();
  },

  /**
   * Validates venue slug for security
   */
  validateVenueSlug: (slug: string): { isValid: boolean; reason?: string } => {
    if (!slug) return { isValid: false, reason: 'Slug is required' };
    
    // Only allow alphanumeric characters and hyphens
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { isValid: false, reason: 'Slug can only contain lowercase letters, numbers, and hyphens' };
    }
    
    // Prevent reserved words
    const reservedWords = ['admin', 'api', 'www', 'app', 'dashboard', 'auth', 'login', 'register'];
    if (reservedWords.includes(slug)) {
      return { isValid: false, reason: 'Slug cannot be a reserved word' };
    }
    
    if (slug.length < 3 || slug.length > 50) {
      return { isValid: false, reason: 'Slug must be between 3 and 50 characters' };
    }
    
    return { isValid: true };
  },

  /**
   * Rate limiting helper
   */
  checkRateLimit: (identifier: string, windowMs: number = 15 * 60 * 1000, maxAttempts: number = 5): boolean => {
    const key = `rate_limit_${identifier}`;
    const now = Date.now();
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify({ attempts: 1, firstAttempt: now }));
        return true;
      }
      
      const data = JSON.parse(stored);
      
      // Reset if window has passed
      if (now - data.firstAttempt > windowMs) {
        localStorage.setItem(key, JSON.stringify({ attempts: 1, firstAttempt: now }));
        return true;
      }
      
      // Check if under limit
      if (data.attempts < maxAttempts) {
        localStorage.setItem(key, JSON.stringify({ ...data, attempts: data.attempts + 1 }));
        return true;
      }
      
      return false; // Rate limited
    } catch (error) {
      console.error('Error in rate limiting:', error);
      return true; // Allow on error
    }
  }
};
