
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SecurityAuditLogger, SessionSecurity, FingerprintDetector } from '@/utils/securityUtils';

interface SecurityContextType {
  isAutomationDetected: boolean;
  fingerprint: string;
  securityLevel: 'low' | 'medium' | 'high';
  reportSecurityEvent: (eventType: string, details: Record<string, any>) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAutomationDetected, setIsAutomationDetected] = useState(false);
  const [fingerprint, setFingerprint] = useState('');
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    // Initialize security monitoring
    const initSecurity = async () => {
      try {
        // Detect automation
        const automationDetected = FingerprintDetector.detectAutomation();
        setIsAutomationDetected(automationDetected);

        // Generate fingerprint
        const fp = FingerprintDetector.getFingerprint();
        setFingerprint(fp);

        // Initialize session monitoring
        SessionSecurity.initializeSessionMonitoring();

        // Determine security level based on various factors
        let level: 'low' | 'medium' | 'high' = 'medium';
        if (automationDetected) {
          level = 'high';
        }
        setSecurityLevel(level);

        // Log security initialization
        SecurityAuditLogger.logSecurityEvent('security_initialized', {
          automationDetected,
          fingerprint: fp,
          securityLevel: level
        });

      } catch (error) {
        console.error('Security initialization failed:', error);
        SecurityAuditLogger.logSecurityEvent('security_init_failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'high');
      }
    };

    initSecurity();

    // Listen for session timeout events
    const handleSessionTimeout = () => {
      // This would trigger logout in your auth context
      console.warn('Session timeout detected');
    };

    window.addEventListener('session_timeout', handleSessionTimeout);

    return () => {
      SessionSecurity.cleanup();
      window.removeEventListener('session_timeout', handleSessionTimeout);
    };
  }, []);

  const reportSecurityEvent = (eventType: string, details: Record<string, any>) => {
    SecurityAuditLogger.logSecurityEvent(eventType, {
      ...details,
      fingerprint,
      automationDetected: isAutomationDetected
    });
  };

  return (
    <SecurityContext.Provider
      value={{
        isAutomationDetected,
        fingerprint,
        securityLevel,
        reportSecurityEvent
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};
