
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  Users, 
  UserCheck, 
  Clock, 
  Smartphone, 
  Tablet, 
  Monitor,
  TrendingUp
} from 'lucide-react';
import { useWifiAnalytics } from '@/hooks/useWifiAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function WifiAnalyticsDashboard() {
  const { data: analytics, isLoading } = useWifiAnalytics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const deviceTypeIcons = {
    mobile: Smartphone,
    tablet: Tablet,
    desktop: Monitor,
    unknown: Wifi
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_connections}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Devices</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.unique_devices}</div>
            <p className="text-xs text-muted-foreground">
              Individual visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Visitors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.returning_visitors}</div>
            <p className="text-xs text-muted-foreground">
              Repeat connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avg_session_duration}m</div>
            <p className="text-xs text-muted-foreground">
              Session duration
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Signup Conversion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Signup Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <span className="text-lg font-semibold">{analytics.signup_conversion_rate}%</span>
            </div>
            <Progress value={analytics.signup_conversion_rate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Percentage of connections that completed signup
            </p>
          </CardContent>
        </Card>

        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.device_types).map(([type, count]) => {
                const Icon = deviceTypeIcons[type as keyof typeof deviceTypeIcons] || Wifi;
                const percentage = analytics.total_connections > 0 
                  ? (count / analytics.total_connections) * 100 
                  : 0;
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(percentage)}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Connections Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Connection Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourly_connections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(hour) => `${hour}:00`}
                  formatter={(value) => [value, 'Connections']}
                />
                <Bar dataKey="connections" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recent_connections.map((connection) => {
              const Icon = deviceTypeIcons[connection.device_type as keyof typeof deviceTypeIcons] || Wifi;
              
              return (
                <div key={connection.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {connection.guest_name || 'Anonymous User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(connection.connected_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={connection.signup_completed ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {connection.signup_completed ? 'Signed Up' : 'Anonymous'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
