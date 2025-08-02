
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { usePlatformVenues } from "@/hooks/usePlatformVenues";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, Settings, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { HomepageAnalyticsDashboard } from "@/components/homepage/HomepageAnalyticsDashboard";

export default function PlatformDashboard() {
  const { data: metrics, isLoading, error } = usePlatformMetrics();
  const { data: venues = [] } = usePlatformVenues();

  const pendingVenues = venues.filter(v => v.approval_status === 'pending');
  const recentVenues = venues.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Platform Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Platform Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading dashboard metrics</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Venues",
      value: metrics?.totalVenues || 0,
      description: "All venues on platform",
      icon: Building2,
      color: "text-blue-600",
      trend: "+12% from last month",
    },
    {
      title: "Active Venues",
      value: metrics?.activeVenues || 0,
      description: "Approved and operating",
      icon: CheckCircle,
      color: "text-green-600",
      trend: `${metrics?.activeVenues}/${metrics?.totalVenues} approved`,
    },
    {
      title: "Pending Approvals",
      value: metrics?.pendingVenues || 0,
      description: "Awaiting review",
      icon: Clock,
      color: "text-yellow-600",
      trend: "Requires attention",
    },
    {
      title: "Total Users",
      value: metrics?.totalUsers || 0,
      description: "Platform users",
      icon: Users,
      color: "text-purple-600",
      trend: "+8% from last month",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time platform overview and metrics
          </p>
        </div>
        {pendingVenues.length > 0 && (
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link to="/platform/venues">
              <Clock className="h-4 w-4 mr-2" />
              {pendingVenues.length} Pending Approvals
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {card.trend}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Homepage Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Homepage Analytics
          </CardTitle>
          <CardDescription>
            Analytics data from your Grace homepage visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomepageAnalyticsDashboard />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Venue Applications</CardTitle>
            <CardDescription>
              Latest venue registration requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVenues.length > 0 ? (
                recentVenues.map((venue) => (
                  <div key={venue.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{venue.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(venue.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        venue.approval_status === 'approved' ? 'bg-green-500' :
                        venue.approval_status === 'rejected' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm capitalize">{venue.approval_status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No venues registered yet</p>
              )}
            </div>
            {venues.length > 5 && (
              <Button variant="outline" asChild className="w-full mt-4">
                <Link to="/platform/venues">View All Venues</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common platform administration tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" asChild className="w-full justify-start">
                <Link to="/platform/venues">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Venues
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link to="/platform/users">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link to="/platform/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Platform Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Overall platform status and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Database</div>
                <div className="text-sm text-muted-foreground">Operational</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Authentication</div>
                <div className="text-sm text-muted-foreground">Operational</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">API Services</div>
                <div className="text-sm text-muted-foreground">Operational</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
