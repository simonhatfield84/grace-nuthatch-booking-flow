
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Server, Database, Mail, CreditCard, AlertTriangle, CheckCircle, Clock, Eye } from "lucide-react";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";

export function SecurityTab() {
  const { data: healthStatus, isLoading: healthLoading } = useSystemHealth();
  const { data: auditEvents = [], isLoading: auditLoading } = useSecurityAudit();

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventBadge = (eventType: string) => {
    const criticalEvents = ['permission_denied', 'login_failure', 'unauthorized_access'];
    return criticalEvents.includes(eventType) ? 'destructive' : 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health Status
          </CardTitle>
          <CardDescription>
            Real-time health monitoring of critical services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className={`p-4 rounded-lg border ${getHealthColor(healthStatus?.database?.status || 'unknown')}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Database</span>
                  </div>
                  {getHealthIcon(healthStatus?.database?.status || 'unknown')}
                </div>
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">
                    Response: {healthStatus?.database?.responseTime || 'N/A'}ms
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${getHealthColor(healthStatus?.auth?.status || 'unknown')}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Authentication</span>
                  </div>
                  {getHealthIcon(healthStatus?.auth?.status || 'unknown')}
                </div>
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">
                    Response: {healthStatus?.auth?.responseTime || 'N/A'}ms
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${getHealthColor(healthStatus?.email?.status || 'unknown')}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email Service</span>
                  </div>
                  {getHealthIcon(healthStatus?.email?.status || 'unknown')}
                </div>
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">
                    Response: {healthStatus?.email?.responseTime || 'N/A'}ms
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${getHealthColor(healthStatus?.payments?.status || 'unknown')}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">Payment Service</span>
                  </div>
                  {getHealthIcon(healthStatus?.payments?.status || 'unknown')}
                </div>
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">
                    Response: {healthStatus?.payments?.responseTime || 'N/A'}ms
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Latest security audit events for your venue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : auditEvents.length > 0 ? (
            <div className="space-y-3">
              {auditEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{event.event_type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getEventBadge(event.event_type)}>
                    {event.event_type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent security events</p>
          )}
        </CardContent>
      </Card>

      {/* Security Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Best Practices
          </CardTitle>
          <CardDescription>
            Recommended security practices for your venue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Regular Password Updates</div>
                <div className="text-sm text-muted-foreground">
                  Update your password regularly and use strong, unique passwords
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Monitor User Access</div>
                <div className="text-sm text-muted-foreground">
                  Regularly review user roles and permissions for your venue
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Review Security Logs</div>
                <div className="text-sm text-muted-foreground">
                  Check security events regularly for any suspicious activity
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
