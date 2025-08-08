
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServicePopularityChart, StatusBreakdownChart } from "@/components/dashboard/DashboardCharts";

export const DashboardMockup = () => {
  // Convert mock data to array format for charts
  const mockServiceData = [
    { name: "Dinner", bookings: 15 },
    { name: "Afternoon Tea", bookings: 8 },
    { name: "Brunch", bookings: 12 },
    { name: "Private Event", bookings: 3 }
  ];

  const mockStatusData = [
    { name: "confirmed", count: 23 },
    { name: "seated", count: 8 },
    { name: "finished", count: 15 },
    { name: "cancelled", count: 2 }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">28</div>
            <p className="text-xs text-muted-foreground">↑ 12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">1,247</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">18/24</div>
            <p className="text-xs text-muted-foreground">75% utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">£2,340</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ServicePopularityChart data={mockServiceData} />
        <StatusBreakdownChart data={mockStatusData} />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Sarah Johnson", time: "19:30", guests: 4, service: "Dinner" },
              { name: "Mike Wilson", time: "20:00", guests: 2, service: "Dinner" },
              { name: "Emma Davis", time: "15:00", guests: 6, service: "Afternoon Tea" }
            ].map((booking, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{booking.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.time} • {booking.guests} guests • {booking.service}
                  </p>
                </div>
                <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary">
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
