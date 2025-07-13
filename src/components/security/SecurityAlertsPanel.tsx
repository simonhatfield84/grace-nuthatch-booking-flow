import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSecurityAlerts } from "@/hooks/useSecurityAlerts";
import { AlertTriangle, Eye, RefreshCw, User, Clock } from "lucide-react";
import { format } from "date-fns";

function SecurityAlertsPanel() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const { data: alerts, isLoading, refetch } = useSecurityAlerts(timeRange);

  const getSeverityLevel = (eventCount: number) => {
    if (eventCount >= 10) return { level: 'critical', color: 'destructive' };
    if (eventCount >= 5) return { level: 'high', color: 'destructive' };
    if (eventCount >= 3) return { level: 'medium', color: 'default' };
    return { level: 'low', color: 'secondary' };
  };

  const getEventDescription = (activity: string) => {
    const descriptions: Record<string, string> = {
      'unauthorized_role_change_attempt': 'User attempted to change roles without permission',
      'self_elevation_attempt': 'User tried to elevate their own privileges',
      'owner_demotion_attempt_blocked': 'Attempt to demote owner role was blocked',
      'direct_role_update_blocked': 'Direct database role update was prevented',
      'venue_creation_rate_limit_exceeded': 'Multiple venue creation attempts detected',
      'venue_creation_unauthorized': 'Unauthorized venue creation attempt',
    };
    
    return descriptions[activity] || activity.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Security Alerts</span>
            </CardTitle>
            <CardDescription>
              Suspicious activities requiring attention
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : !alerts?.length ? (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              No suspicious activities detected in the selected time range.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => {
              const severity = getSeverityLevel(alert.event_count);
              
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant={severity.color as any}>
                        {severity.level.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">
                          {getEventDescription(alert.suspicious_activity)}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>User: {alert.user_id?.slice(0, 8)}...</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(alert.last_event), 'MMM dd, HH:mm')}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-destructive">
                        {alert.event_count}
                      </p>
                      <p className="text-xs text-muted-foreground">attempts</p>
                    </div>
                  </div>
                  
                  {alert.event_count >= 5 && (
                    <Alert className="bg-destructive/10 border-destructive">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive text-sm">
                        <strong>High Risk:</strong> This user has made {alert.event_count} suspicious attempts. 
                        Consider reviewing their access permissions or temporarily restricting their account.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SecurityAlertsPanel;