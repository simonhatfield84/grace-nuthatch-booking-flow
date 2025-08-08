
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWifiAnalytics } from '@/hooks/useWifiAnalytics';
import { Wifi, Users, Repeat, Clock, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export const WifiAnalyticsDashboard: React.FC = () => {
  const { data: wifiData, isLoading } = useWifiAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!wifiData) {
    return (
      <div className="text-center py-8">
        <Wifi className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No WiFi analytics data available</p>
      </div>
    );
  }

  const { summary, deviceTypes, recentConnections } = wifiData;

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalConnections}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Devices</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueDevices}</div>
            <p className="text-xs text-muted-foreground">Individual devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Visitors</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.returningVisitors}</div>
            <p className="text-xs text-muted-foreground">Repeat connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageSessionDuration}m</div>
            <p className="text-xs text-muted-foreground">Session duration</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(deviceTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(type)}
                    <span className="capitalize">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{count}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((count / summary.totalConnections) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Connections */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentConnections.slice(0, 5).map((connection: any) => (
                <div key={connection.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(connection.device_type || 'desktop')}
                    <span className="font-medium">
                      {connection.guests?.name || 'Anonymous'}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(connection.connected_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
              {recentConnections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent connections
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Stats */}
      {summary.conversionRate > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Guest Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">WiFi users who became registered guests</p>
                <p className="text-2xl font-bold text-green-600">{summary.conversionRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-lg font-semibold">{summary.activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
