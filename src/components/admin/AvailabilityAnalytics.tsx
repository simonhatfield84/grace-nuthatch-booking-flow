import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, AlertTriangle, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AvailabilityAnalyticsProps {
  venueId: string;
}

export function AvailabilityAnalytics({ venueId }: AvailabilityAnalyticsProps) {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['availability-metrics', venueId],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('availability_logs')
        .select('*')
        .eq('venue_id', venueId)
        .gte('occurred_at', twentyFourHoursAgo.toISOString());
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          total: 0,
          rateLimited: 0,
          errors: 0,
          avgResponseMs: 0,
          cacheHitRate: '0'
        };
      }
      
      const validTookMs = data.filter(l => l.took_ms && l.took_ms > 0);
      const avgMs = validTookMs.length > 0
        ? Math.round(validTookMs.reduce((sum, l) => sum + l.took_ms, 0) / validTookMs.length)
        : 0;
      
      return {
        total: data.length,
        rateLimited: data.filter(l => l.status === 'rate_limited').length,
        errors: data.filter(l => l.status === 'error').length,
        avgResponseMs: avgMs,
        cacheHitRate: data.length > 0 
          ? (data.filter(l => l.cached).length / data.length * 100).toFixed(1)
          : '0'
      };
    },
    refetchInterval: 30000,
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['availability-logs-recent', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_logs')
        .select('*')
        .eq('venue_id', venueId)
        .order('occurred_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  if (metricsLoading || logsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{metrics?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Last 24h</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{metrics?.avgResponseMs || 0}ms</p>
                <p className="text-xs text-muted-foreground">Server processing</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rate Limited</p>
                <p className="text-2xl font-bold">{metrics?.rateLimited || 0}</p>
                <p className="text-xs text-muted-foreground">Blocked requests</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{metrics?.cacheHitRate || 0}%</p>
                <p className="text-xs text-muted-foreground">60s cache</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Availability Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentLogs || recentLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No availability checks yet</p>
              <p className="text-sm mt-2">Data will appear here once guests start checking availability</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        log.status === 'ok' ? 'default' :
                        log.status === 'rate_limited' ? 'destructive' :
                        'secondary'
                      }>
                        {log.status}
                      </Badge>
                      <span className="text-sm">
                        {log.date} • Party of {log.party_size}
                      </span>
                      {log.cached && (
                        <Badge variant="outline" className="text-xs">cached</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.occurred_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{log.result_slots || 0} slots</p>
                    {log.took_ms && <p className="text-xs text-muted-foreground">{log.took_ms}ms</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
