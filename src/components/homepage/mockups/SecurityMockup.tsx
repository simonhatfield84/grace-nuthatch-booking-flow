import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Eye, Activity, Lock } from 'lucide-react';
import { mockSecurityEvents, mockSecurityMetrics } from '@/data/mockData';
import { format } from 'date-fns';

export const SecurityMockup = () => {
  const getEventSeverity = (eventType: string) => {
    const critical = ['unauthorized_access_attempt', 'role_elevation_blocked'];
    const high = ['suspicious_login_pattern', 'multiple_failed_attempts'];
    const medium = ['role_change_successful', 'password_reset'];
    
    if (critical.includes(eventType)) return 'critical';
    if (high.includes(eventType)) return 'high';
    if (medium.includes(eventType)) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Dashboard - System Monitoring
        </CardTitle>
        <CardDescription>
          Real-time security monitoring and threat detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {mockSecurityMetrics.criticalEvents}
              </div>
              <p className="text-xs text-muted-foreground">
                Requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
              <Eye className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {mockSecurityMetrics.suspiciousEvents}
              </div>
              <p className="text-xs text-muted-foreground">
                Potential security concerns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockSecurityMetrics.totalEvents}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Lock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {mockSecurityMetrics.activeAlerts}
              </div>
              <p className="text-xs text-muted-foreground">
                System secure
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Security Alert */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Security Notice:</strong> 2 suspicious login attempts detected from new IP addresses. Review recommended.
          </AlertDescription>
        </Alert>

        {/* Recent Security Events */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Security Events
          </h4>
          
          {mockSecurityEvents.map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant={getSeverityColor(getEventSeverity(event.event_type)) as any}>
                  {getEventSeverity(event.event_type).toUpperCase()}
                </Badge>
                <div>
                  <p className="font-medium">
                    {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.event_details && typeof event.event_details === 'object' 
                      ? Object.entries(event.event_details as Record<string, any>)
                          .slice(0, 2)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')
                      : 'System event logged'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                </p>
                <p className="text-xs text-muted-foreground">
                  IP: {event.ip_address}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Security Status */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">99.2%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">256-bit</div>
              <div className="text-sm text-muted-foreground">Encryption</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">3-Factor</div>
              <div className="text-sm text-muted-foreground">Authentication</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};