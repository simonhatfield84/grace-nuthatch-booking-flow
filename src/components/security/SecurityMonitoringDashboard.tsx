
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Shield, TrendingUp, Users, Zap } from "lucide-react";
import { SecurityAuditPanel } from "./SecurityAuditPanel";

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  threatLevels: {
    high: number;
    medium: number;
    low: number;
  };
  topEventTypes: Array<{
    event_type: string;
    count: number;
  }>;
  recentThrends: {
    lastHour: number;
    lastDay: number;
    lastWeek: number;
  };
}

export function SecurityMonitoringDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['security-metrics'],
    queryFn: async (): Promise<SecurityMetrics> => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get total events
      const { count: totalEvents } = await supabase
        .from('security_audit')
        .select('*', { count: 'exact', head: true });

      // Get critical events (permission_denied, login_failure, etc.)
      const { count: criticalEvents } = await supabase
        .from('security_audit')
        .select('*', { count: 'exact', head: true })
        .in('event_type', ['permission_denied', 'login_failure']);

      // Get threat level distribution
      const { data: threatData } = await supabase
        .from('security_audit')
        .select('event_details')
        .not('event_details->threat_level', 'is', null);

      const threatLevels = { high: 0, medium: 0, low: 0 };
      threatData?.forEach(event => {
        const level = event.event_details?.threat_level;
        if (level && threatLevels.hasOwnProperty(level)) {
          threatLevels[level as keyof typeof threatLevels]++;
        }
      });

      // Get top event types
      const { data: eventTypes } = await supabase
        .rpc('get_event_type_counts', {});

      // Get recent trends
      const { count: lastHour } = await supabase
        .from('security_audit')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo.toISOString());

      const { count: lastDay } = await supabase
        .from('security_audit')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo.toISOString());

      const { count: lastWeek } = await supabase
        .from('security_audit')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      return {
        totalEvents: totalEvents || 0,
        criticalEvents: criticalEvents || 0,
        threatLevels,
        topEventTypes: eventTypes || [],
        recentThrends: {
          lastHour: lastHour || 0,
          lastDay: lastDay || 0,
          lastWeek: lastWeek || 0,
        },
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getThreatLevelColor = (level: string, count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-800";
    switch (level) {
      case 'high': return "bg-red-100 text-red-800";
      case 'medium': return "bg-yellow-100 text-yellow-800";
      case 'low': return "bg-green-100 text-green-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              All tracked security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.criticalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Hour Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.recentThrends.lastHour || 0}</div>
            <p className="text-xs text-muted-foreground">
              Events in the last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.recentThrends.lastWeek || 0}</div>
            <p className="text-xs text-muted-foreground">
              Events this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Threat Level Distribution</CardTitle>
            <CardDescription>
              Current threat level breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics?.threatLevels || {}).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <Badge className={getThreatLevelColor(level, count)}>
                    {level.toUpperCase()}
                  </Badge>
                  <span className="text-2xl font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Event Types</CardTitle>
            <CardDescription>
              Most common security events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topEventTypes.slice(0, 5).map((event, index) => (
                <div key={event.event_type} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {event.event_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <Badge variant="outline">{event.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <SecurityAuditPanel />
    </div>
  );
}
