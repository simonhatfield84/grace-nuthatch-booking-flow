
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Key, AlertTriangle, Activity, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  environment: string;
  key_type: string;
  success: boolean;
  error_message?: string;
  created_at: string;
  user_id?: string;
  ip_address?: string;
  metadata: any;
}

export const StripeSecurityDashboard = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_key_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'viewed':
        return <Eye className="h-3 w-3" />;
      case 'updated':
      case 'created':
        return <Key className="h-3 w-3" />;
      case 'decrypted':
        return <Shield className="h-3 w-3" />;
      case 'environment_switched':
        return <Activity className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getActionBadge = (log: AuditLog) => {
    const variant = log.success ? "default" : "destructive";
    const icon = getActionIcon(log.action);
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {log.action.replace('_', ' ')}
      </Badge>
    );
  };

  const getEnvironmentBadge = (environment: string) => {
    return (
      <Badge variant={environment === 'live' ? "destructive" : "secondary"}>
        {environment.toUpperCase()}
      </Badge>
    );
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Environment', 'Key Type', 'Success', 'User ID', 'Error'],
      ...auditLogs.map(log => [
        log.created_at,
        log.action,
        log.environment,
        log.key_type,
        log.success ? 'Yes' : 'No',
        log.user_id || 'System',
        log.error_message || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stripe-audit-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getRecentActivity = () => {
    const last24h = auditLogs.filter(log => {
      const logDate = new Date(log.created_at);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return logDate > yesterday;
    });

    return {
      total: last24h.length,
      failed: last24h.filter(log => !log.success).length,
      keyAccess: last24h.filter(log => log.action === 'decrypted').length,
      environmentSwitches: last24h.filter(log => log.action === 'environment_switched').length,
    };
  };

  const activity = getRecentActivity();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            24-Hour Activity Summary
          </CardTitle>
          <CardDescription>
            Key access and security events in the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{activity.total}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{activity.failed}</div>
              <div className="text-sm text-muted-foreground">Failed Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activity.keyAccess}</div>
              <div className="text-sm text-muted-foreground">Key Decryptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{activity.environmentSwitches}</div>
              <div className="text-sm text-muted-foreground">Env Switches</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Audit Trail
              </CardTitle>
              <CardDescription>
                Comprehensive log of all Stripe key access and modifications
              </CardDescription>
            </div>
            <Button onClick={exportAuditLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No audit logs found
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    log.success ? 'bg-background' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getActionBadge(log)}
                    {getEnvironmentBadge(log.environment)}
                    <Badge variant="outline">{log.key_type}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{log.user_id === user?.id ? 'You' : log.user_id ? 'User' : 'System'}</span>
                    <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.failed > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">Failed Key Access Attempts</div>
                  <div className="text-sm text-red-600">
                    {activity.failed} failed attempt{activity.failed > 1 ? 's' : ''} in the last 24 hours
                  </div>
                </div>
              </div>
            )}

            {activity.keyAccess > 10 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Eye className="h-4 w-4 text-amber-600" />
                <div>
                  <div className="font-medium text-amber-800">High Key Access Volume</div>
                  <div className="text-sm text-amber-600">
                    {activity.keyAccess} key decryptions in 24 hours (unusually high)
                  </div>
                </div>
              </div>
            )}

            {activity.failed === 0 && activity.keyAccess <= 10 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Shield className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">All Systems Secure</div>
                  <div className="text-sm text-green-600">
                    No security incidents detected in the last 24 hours
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
