
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedSecurity } from "@/hooks/useEnhancedSecurity";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SessionInfo {
  lastActivity: Date;
  sessionStart: Date;
  warningShown: boolean;
}

export const SessionSecurityManager = () => {
  const { user, signOut } = useAuth();
  const { logSecurityEvent, getCurrentThreatLevel } = useEnhancedSecurity();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    lastActivity: new Date(),
    sessionStart: new Date(),
    warningShown: false
  });
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Session timeout configurations based on threat level
  const getSessionTimeout = () => {
    const threatLevel = getCurrentThreatLevel();
    switch (threatLevel) {
      case 'high':
        return 15 * 60 * 1000; // 15 minutes
      case 'medium':
        return 30 * 60 * 1000; // 30 minutes
      default:
        return 60 * 60 * 1000; // 1 hour
    }
  };

  const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before timeout

  // Update last activity
  const updateActivity = () => {
    setSessionInfo(prev => ({
      ...prev,
      lastActivity: new Date(),
      warningShown: false
    }));
    setShowTimeoutWarning(false);
  };

  // Handle automatic logout
  const handleSessionTimeout = async () => {
    await logSecurityEvent('session_timeout', {
      session_duration: Date.now() - sessionInfo.sessionStart.getTime(),
      threat_level: getCurrentThreatLevel()
    }, 'MEDIUM');

    toast.error('Session expired for security', {
      description: 'Please sign in again to continue'
    });
    
    await signOut();
  };

  // Extend session
  const extendSession = () => {
    updateActivity();
    toast.success('Session extended', {
      description: 'Your session has been extended for security'
    });
  };

  // Monitor session activity
  useEffect(() => {
    if (!user) return;

    const sessionTimeout = getSessionTimeout();

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => updateActivity();
    
    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Set up session monitoring
    const checkSession = () => {
      const now = Date.now();
      const timeSinceActivity = now - sessionInfo.lastActivity.getTime();
      const timeUntilTimeout = sessionTimeout - timeSinceActivity;

      if (timeSinceActivity >= sessionTimeout) {
        handleSessionTimeout();
      } else if (timeUntilTimeout <= WARNING_THRESHOLD && !sessionInfo.warningShown) {
        setShowTimeoutWarning(true);
        setSessionInfo(prev => ({ ...prev, warningShown: true }));
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler, true);
      });
      clearInterval(interval);
    };
  }, [user, sessionInfo.lastActivity, sessionInfo.warningShown]);

  // Monitor for concurrent sessions (simplified detection)
  useEffect(() => {
    if (!user) return;

    const checkConcurrentSessions = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const sessionToken = session?.session?.access_token;

        if (sessionToken) {
          const tokenParts = sessionToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const tokenIssuedAt = payload.iat * 1000;
            
            // If token was issued significantly after our session started,
            // it might indicate a concurrent session
            if (tokenIssuedAt > sessionInfo.sessionStart.getTime() + 60000) {
              await logSecurityEvent('concurrent_session_detected', {
                original_session: sessionInfo.sessionStart.getTime(),
                new_token_issued: tokenIssuedAt,
                user_id: user.id
              }, 'HIGH');
            }
          }
        }
      } catch (error) {
        console.error('Session validation error:', error);
      }
    };

    const interval = setInterval(checkConcurrentSessions, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [user, sessionInfo.sessionStart, logSecurityEvent]);

  if (!user || !showTimeoutWarning) return null;

  const timeRemaining = Math.max(0, getSessionTimeout() - (Date.now() - sessionInfo.lastActivity.getTime()));
  const minutesRemaining = Math.ceil(timeRemaining / 60000);

  return (
    <Alert className="fixed top-4 right-4 max-w-md z-50 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Session Timeout Warning</span>
        </div>
        <p className="text-sm">
          Your session will expire in {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''} due to inactivity.
        </p>
        <div className="flex items-center gap-2">
          <Button onClick={extendSession} size="sm" className="flex-1">
            <Shield className="h-4 w-4 mr-2" />
            Stay Signed In
          </Button>
          <Button onClick={handleSessionTimeout} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
