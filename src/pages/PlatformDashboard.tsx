
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function PlatformDashboard() {
  const { data: metrics, isLoading, error } = usePlatformMetrics();

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
    },
    {
      title: "Active Venues",
      value: metrics?.activeVenues || 0,
      description: "Approved and operating",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Pending Venues",
      value: metrics?.pendingVenues || 0,
      description: "Awaiting approval",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Total Users",
      value: metrics?.totalUsers || 0,
      description: "Platform users",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Total Bookings",
      value: metrics?.totalBookings || 0,
      description: "All-time bookings",
      icon: Calendar,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time platform overview and metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Platform activity will be displayed here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed coming in Phase 2
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Overall platform status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">All systems operational</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
