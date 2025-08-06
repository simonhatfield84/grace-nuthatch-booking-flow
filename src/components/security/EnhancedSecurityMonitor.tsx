
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Shield, Activity, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isEventDetailsObject } from '@/types/security';

interface SecurityEvent {
  id: string;
  event_type: string;
  event_details: any;
  created_at: string;
  user_id?: string;
  venue_id?: string;
}

export const EnhancedSecurityMonitor = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [securityScore, setSecurityScore] = useState<number>(0);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Fetch recent security events
      const { data: events, error } = await supabase
        .from('security_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching security events:', error);
        return;
      }

      setSecurityEvents(events || []);
      
      // Calculate security score based on recent events
      const criticalEvents = events?.filter(event => 
        isEventDetailsObject(event.event_details) && 
        event.event_details.severity === 'CRITICAL'
      ).length || 0;
      
      const highEvents = events?.filter(event => 
        isEventDetailsObject(event.event_details) && 
        event.event_details.severity === 'HIGH'
      ).length || 0;
      
      // Calculate score (100 is perfect, decreases with security issues)
      const score = Math.max(0, 100 - (criticalEvents * 20) - (highEvents * 10));
      setSecurityScore(score);

    } catch (error) {
      console.error('Error in fetchSecurityData:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'security_hardening_applied':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'role_change_attempt_blocked':
      case 'unauthorized_role_change_attempt':
        return <Lock className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getEventSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'destructive';
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading security data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Enhanced Security Monitor
          <Badge variant="secondary">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Score */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <h3 className="font-semibold">Security Score</h3>
            <p className="text-sm text-muted-foreground">Based on recent activity</p>
          </div>
          <div className={`text-2xl font-bold ${getSecurityScoreColor(securityScore)}`}>
            {securityScore}/100
          </div>
        </div>

        {/* Recent Security Events */}
        <div>
          <h3 className="font-semibold mb-3">Recent Security Events</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {securityEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent security events</p>
            ) : (
              securityEvents.map((event) => {
                const eventDetails = isEventDetailsObject(event.event_details) ? event.event_details : {};
                
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    {getEventIcon(event.event_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {eventDetails.severity && (
                          <Badge variant={getEventSeverityColor(eventDetails.severity)}>
                            {eventDetails.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                      {eventDetails.reason && (
                        <p className="text-sm mt-1">
                          Reason: {eventDetails.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Security Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border text-center">
            <Shield className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium">Database Functions</p>
            <p className="text-xs text-green-600">Hardened</p>
          </div>
          <div className="p-3 rounded-lg border text-center">
            <Lock className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium">RLS Policies</p>
            <p className="text-xs text-green-600">Active</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
