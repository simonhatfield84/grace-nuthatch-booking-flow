
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  sanitizeEmail, 
  validatePasswordStrength, 
  detectThreatLevel,
  AdvancedRateLimiter 
} from '@/utils/enhancedSecurityUtils';

export const useEnhancedAuth = () => {
  const [loading, setLoading] = useState(false);

  const signInWithEnhancedSecurity = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Enhanced input validation
      const cleanEmail = sanitizeEmail(email);
      
      // Threat detection
      const userAgent = navigator.userAgent;
      const referer = document.referrer;
      const threatLevel = detectThreatLevel(userAgent, referer);
      
      // Rate limiting based on threat level
      const clientId = AdvancedRateLimiter.getClientIdentifier(userAgent);
      const rateLimitCheck = await AdvancedRateLimiter.checkLimit(
        clientId,
        { windowMs: 15 * 60 * 1000, maxRequests: threatLevel === 'high' ? 3 : 5 },
        threatLevel
      );
      
      if (!rateLimitCheck.allowed) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      
      // Log the sign-in attempt
      await supabase.rpc('log_security_event', {
        p_event_type: 'signin_attempt',
        p_event_details: {
          email: cleanEmail,
          threat_level: threatLevel,
          user_agent: userAgent,
          referer: referer,
          timestamp: new Date().toISOString()
        },
        p_severity: threatLevel === 'high' ? 'HIGH' : 'MEDIUM'
      });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      
      if (error) {
        // Log failed signin
        await supabase.rpc('log_security_event', {
          p_event_type: 'signin_failed',
          p_event_details: {
            email: cleanEmail,
            error_message: error.message,
            threat_level: threatLevel,
            user_agent: userAgent
          },
          p_severity: 'HIGH'
        });
        
        throw error;
      }
      
      // Log successful signin
      if (data.user) {
        await supabase.rpc('log_security_event', {
          p_event_type: 'signin_successful',
          p_event_details: {
            user_id: data.user.id,
            email: cleanEmail,
            threat_level: threatLevel,
            user_agent: userAgent
          },
          p_user_id: data.user.id,
          p_severity: 'MEDIUM'
        });
      }
      
      return { data, error: null };
      
    } catch (error) {
      console.error('Enhanced sign-in error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Sign-in failed') 
      };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEnhancedSecurity = async (
    email: string, 
    password: string, 
    additionalData?: Record<string, any>
  ) => {
    setLoading(true);
    
    try {
      // Enhanced input validation
      const cleanEmail = sanitizeEmail(email);
      
      // Password strength validation
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password requirements not met: ${passwordValidation.feedback.join(', ')}`);
      }
      
      // Threat detection
      const userAgent = navigator.userAgent;
      const referer = document.referrer;
      const threatLevel = detectThreatLevel(userAgent, referer);
      
      // Stricter rate limiting for signup
      const clientId = AdvancedRateLimiter.getClientIdentifier(userAgent);
      const rateLimitCheck = await AdvancedRateLimiter.checkLimit(
        clientId,
        { windowMs: 60 * 60 * 1000, maxRequests: threatLevel === 'high' ? 1 : 3 },
        threatLevel
      );
      
      if (!rateLimitCheck.allowed) {
        throw new Error('Too many signup attempts. Please try again later.');
      }
      
      // Log the signup attempt
      await supabase.rpc('log_security_event', {
        p_event_type: 'signup_attempt',
        p_event_details: {
          email: cleanEmail,
          threat_level: threatLevel,
          password_score: passwordValidation.score,
          user_agent: userAgent,
          referer: referer,
          timestamp: new Date().toISOString()
        },
        p_severity: threatLevel === 'high' ? 'HIGH' : 'LOW'
      });
      
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: additionalData || {}
        }
      });
      
      if (error) {
        // Log failed signup
        await supabase.rpc('log_security_event', {
          p_event_type: 'signup_failed',
          p_event_details: {
            email: cleanEmail,
            error_message: error.message,
            threat_level: threatLevel,
            user_agent: userAgent
          },
          p_severity: 'HIGH'
        });
        
        throw error;
      }
      
      // Log successful signup
      if (data.user) {
        await supabase.rpc('log_security_event', {
          p_event_type: 'signup_successful',
          p_event_details: {
            user_id: data.user.id,
            email: cleanEmail,
            threat_level: threatLevel,
            user_agent: userAgent
          },
          p_user_id: data.user.id,
          p_severity: 'MEDIUM'
        });
      }
      
      return { data, error: null };
      
    } catch (error) {
      console.error('Enhanced sign-up error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Sign-up failed') 
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordWithSecurity = async (email: string) => {
    setLoading(true);
    
    try {
      const cleanEmail = sanitizeEmail(email);
      
      // Rate limiting for password resets
      const userAgent = navigator.userAgent;
      const clientId = AdvancedRateLimiter.getClientIdentifier(userAgent);
      const rateLimitCheck = await AdvancedRateLimiter.checkLimit(
        clientId,
        { windowMs: 15 * 60 * 1000, maxRequests: 3 }
      );
      
      if (!rateLimitCheck.allowed) {
        throw new Error('Too many password reset attempts. Please try again later.');
      }
      
      // Log the password reset attempt
      await supabase.rpc('log_security_event', {
        p_event_type: 'password_reset_attempt',
        p_event_details: {
          email: cleanEmail,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        },
        p_severity: 'MEDIUM'
      });
      
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) throw error;
      
      toast.success('Password reset email sent successfully');
      return { error: null };
      
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error instanceof Error ? error.message : 'Password reset failed');
      return { error: error instanceof Error ? error : new Error('Password reset failed') };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    signInWithEnhancedSecurity,
    signUpWithEnhancedSecurity,
    resetPasswordWithSecurity
  };
};
