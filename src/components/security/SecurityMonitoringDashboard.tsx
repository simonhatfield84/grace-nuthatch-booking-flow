import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSecurityAlerts } from "@/hooks/useSecurityAlerts";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";
import { Shield, AlertTriangle, Eye, Activity, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function SecurityMonitoringDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useSecurityAlerts(timeRange);
  const { data: auditLogs, isLoading: auditLoading, refetch: refetchAudit } = useSecurityAudit(timeRange);

  const criticalEvents = auditLogs?.filter(log => 
    ['unauthorized_role_change_attempt', 'self_elevation_attempt', 'owner_demotion_attempt_blocked'].includes(log.event_type)
  ) || [];

  const suspiciousEvents = auditLogs?.filter(log => 
    ['venue_creation_rate_limit_exceeded', 'venue_creation_unauthorized', 'direct_role_update_blocked'].includes(log.event_type)
  ) || [];

  const getEventSeverity = (eventType: string) => {
    const critical = ['unauthorized_role_change_attempt', 'self_elevation_attempt', 'owner_demotion_attempt_blocked'];
    const high = ['venue_creation_unauthorized', 'direct_role_update_blocked'];
    const medium = ['venue_creation_rate_limit_exceeded', 'venue_creation_validation_failed'];
    
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

  const refreshAll = () => {
    refetchAlerts();
    refetchAudit();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Security Monitoring</h2>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button onClick={refreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <Eye className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{suspiciousEvents.length}</div>
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
            <div className="text-2xl font-bold">{auditLogs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Current security alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalEvents.length > 0 && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Critical Security Events Detected:</strong> {criticalEvents.length} events requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Security Events</span>
          </CardTitle>
          <CardDescription>
            Latest security events and potential threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : auditLogs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No security events found for the selected time range.
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs?.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={getSeverityColor(getEventSeverity(event.event_type)) as any}>
                      {getEventSeverity(event.event_type).toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{event.event_type.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.event_details && typeof event.event_details === 'object' 
                          ? Object.entries(event.event_details as Record<string, any>)
                              .slice(0, 2)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')
                          : 'No additional details'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP: {String(event.ip_address) || 'unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {criticalEvents.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>High Priority:</strong> Review and investigate critical security events immediately.
                </AlertDescription>
              </Alert>
            )}
            
            {suspiciousEvents.length > 5 && (
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  <strong>Medium Priority:</strong> Multiple suspicious activities detected. Consider reviewing user access patterns.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Best Practice:</strong> Regularly review security logs and maintain up-to-date access controls.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}