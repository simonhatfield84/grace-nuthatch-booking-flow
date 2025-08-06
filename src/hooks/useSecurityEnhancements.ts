
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isEventDetailsObject } from '@/types/security';

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  mediumSeverityEvents: number;
  lowSeverityEvents: number;
  securityScore: number;
}

export const useSecurityEnhancements = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSecurityMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('security_audit')
        .select('event_type, event_details, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching security metrics:', error);
        return;
      }

      const events = data || [];
      const totalEvents = events.length;
      
      const severityCounts = events.reduce((acc, event) => {
        const eventDetails = isEventDetailsObject(event.event_details) ? event.event_details : {};
        const severity = eventDetails.severity || 'LOW';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const criticalEvents = severityCounts['CRITICAL'] || 0;
      const highSeverityEvents = severityCounts['HIGH'] || 0;
      const mediumSeverityEvents = severityCounts['MEDIUM'] || 0;
      const lowSeverityEvents = severityCounts['LOW'] || 0;

      // Calculate security score
      const securityScore = Math.max(0, 100 - (criticalEvents * 15) - (highSeverityEvents * 8) - (mediumSeverityEvents * 3));

      setMetrics({
        totalEvents,
        criticalEvents,
        highSeverityEvents,
        mediumSeverityEvents,
        lowSeverityEvents,
        securityScore
      });

    } catch (error) {
      console.error('Error in fetchSecurityMetrics:', error);
      toast.error('Failed to fetch security metrics');
    } finally {
      setLoading(false);
    }
  };

  const logSecurityEvent = async (eventType: string, eventDetails: any, severity: string = 'LOW') => {
    try {
      await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_event_details: { ...eventDetails, severity },
        p_severity: severity
      });
      
      // Refresh metrics after logging
      fetchSecurityMetrics();
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
  }, []);

  return {
    metrics,
    loading,
    refreshMetrics: fetchSecurityMetrics,
    logSecurityEvent
  };
};
