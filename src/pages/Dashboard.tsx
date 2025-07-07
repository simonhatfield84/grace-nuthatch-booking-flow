
import { Button } from "@/components/ui/button";
import { Calendar, Users, Utensils, BarChart3, Plus, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ServicePopularityChart, StatusBreakdownChart } from "@/components/dashboard/DashboardCharts";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const dashboardData = useDashboardData();

  const {
    todaysBookings,
    guests,
    tables,
    revenue,
    unallocated,
    servicePopularity,
    isLoading
  } = dashboardData;

  const tableUtilization = tables.total > 0 
    ? Math.round((tables.booked / tables.total) * 100) 
    : 0;

  const recentBookings = todaysBookings.bookings
    .filter(booking => booking.status === 'confirmed')
    .slice(0, 5);

  console.log('📊 Dashboard rendering with data:', { 
    todaysBookings: todaysBookings.count, 
    guests: guests.total, 
    tables: tables.total,
    isLoading 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Grace OS - Restaurant Management</p>
        </div>
        <div className="flex gap-2">
          <Link to="/host">
            <Button variant="outline">Host Interface</Button>
          </Link>
          <Link to="/booking/demo">
            <Button variant="outline">Booking Widget</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KpiCard
          title="Today's Reservations"
          value={todaysBookings.count}
          description={`Avg ${todaysBookings.averagePartySize} guests per party`}
          icon={Calendar}
          trend={{
            value: Math.abs(todaysBookings.trend),
            isPositive: todaysBookings.trend >= 0
          }}
          color="text-primary"
          isLoading={isLoading}
        />

        <KpiCard
          title="Guest Database"
          value={guests.total.toLocaleString()}
          description="Total registered guests"
          icon={Users}
          color="text-secondary"
          isLoading={isLoading}
        />

        <KpiCard
          title="Table Availability"
          value={`${tables.available}/${tables.total}`}
          description={`${tableUtilization}% utilization`}
          icon={Utensils}
          color="text-accent"
          isLoading={isLoading}
        />

        <KpiCard
          title="Weekly Revenue"
          value={`£${revenue.weekly.toLocaleString()}`}
          description="Estimated from bookings"
          icon={TrendingUp}
          color="text-primary"
          isLoading={isLoading}
        />
      </div>

      {/* Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-1">
          <ServicePopularityChart data={servicePopularity} />
        </div>
        <div className="lg:col-span-1">
          <StatusBreakdownChart data={todaysBookings.statusBreakdown} />
        </div>
        <div className="lg:col-span-1">
          <AlertsPanel 
            unallocatedBookings={unallocated} 
            tableUtilization={tableUtilization}
          />
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Confirmed Bookings</CardTitle>
            <CardDescription>Latest confirmed reservations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
                      <div className="h-3 w-48 bg-muted-foreground/20 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-muted-foreground/20 rounded" />
                  </div>
                ))}
              </div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{booking.guest_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.booking_time} • {booking.party_size} guests • {booking.service}
                        {booking.is_unallocated && (
                          <span className="ml-2 text-amber-600">• Unallocated</span>
                        )}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No confirmed bookings for today
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/services" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
                Add New Service
              </Button>
            </Link>
            <Link to="/tables" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Utensils className="h-4 w-4 mr-2" strokeWidth={2} />
                Manage Tables
              </Button>
            </Link>
            <Link to="/guests" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" strokeWidth={2} />
                View All Guests
              </Button>
            </Link>
            <Link to="/reports" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" strokeWidth={2} />
                Generate Reports
              </Button>
            </Link>
            {unallocated.length > 0 && (
              <Link to="/host" className="block">
                <Button variant="default" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" strokeWidth={2} />
                  Allocate {unallocated.length} Booking{unallocated.length > 1 ? 's' : ''}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
