
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHomepageAnalyticsData } from '@/hooks/useHomepageAnalyticsData';
import { Eye, Users, Clock, TrendingDown, BarChart3, Activity } from 'lucide-react';

export const HomepageAnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading, error } = useHomepageAnalyticsData();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Error loading homepage analytics. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No analytics data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSectionName = (section: string) => {
    return section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Individual users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Browsing sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgBounceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Left within 30 seconds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(analytics.avgSessionDuration)}</div>
            <p className="text-xs text-muted-foreground">Time spent on site</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Sections</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.popularSections.length}</div>
            <p className="text-xs text-muted-foreground">Sections tracked</p>
          </CardContent>
        </Card>
      </div>

      {analytics.popularSections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.popularSections.map((section, index) => (
                <div key={section.section} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <span className="font-medium">{formatSectionName(section.section)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{section.views} views</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Analytics (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.dailyData.slice(0, 7).map((day) => (
                <div key={day.date} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{day.page_views} views</span>
                    <span>{day.unique_visitors} visitors</span>
                    <span>{day.sessions} sessions</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
