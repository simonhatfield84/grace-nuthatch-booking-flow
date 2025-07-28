
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSecurityAlerts } from "@/hooks/useSecurityAlerts";
import { AlertTriangle, Eye, RefreshCw, User, Clock } from "lucide-react";
import { format } from "date-fns";

function SecurityAlertsPanel() {
  const { data: alerts, isLoading, refetch } = useSecurityAlerts();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getEventDescription = (alertType: string) => {
    const descriptions: Record<string, string> = {
      'suspicious_login': 'Suspicious login activity detected',
      'multiple_failed_attempts': 'Multiple failed login attempts',
      'unusual_access_pattern': 'Unusual access pattern detected',
    };
    
    return descriptions[alertType] || alertType.replace(/_/g, ' ').toUpperCase();
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
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
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
              No security alerts detected at this time.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(alert.created_at), 'MMM dd, HH:mm')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {alert.alert_type}
                    </p>
                  </div>
                </div>
                
                {alert.severity === 'critical' && (
                  <Alert className="bg-destructive/10 border-destructive">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive text-sm">
                      <strong>Critical Alert:</strong> This security event requires immediate attention.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SecurityAlertsPanel;
