
import SecurityMonitoringDashboard from "@/components/security/SecurityMonitoringDashboard";
import SecurityAlertsPanel from "@/components/security/SecurityAlertsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { Shield, Server, Database, Mail, CreditCard, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function PlatformSecurity() {
  const { data: healthStatus, isLoading: healthLoading } = useSystemHealth();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Security</h1>
          <p className="text-muted-foreground">
            Monitor security events, system health, and platform-wide threats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-600">System Secured</span>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health Status
          </CardTitle>
          <CardDescription>
            Real-time health monitoring of critical platform services
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
                  <div className="text-xs text-muted-foreground">
                    Last check: {healthStatus?.database?.lastCheck || 'Never'}
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
                  <div className="text-xs text-muted-foreground">
                    Last check: {healthStatus?.auth?.lastCheck || 'Never'}
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
                  <div className="text-xs text-muted-foreground">
                    Last check: {healthStatus?.email?.lastCheck || 'Never'}
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
                  <div className="text-xs text-muted-foreground">
                    Last check: {healthStatus?.payments?.lastCheck || 'Never'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <SecurityAlertsPanel />

      {/* Security Monitoring Dashboard */}
      <SecurityMonitoringDashboard />
    </div>
  );
}
