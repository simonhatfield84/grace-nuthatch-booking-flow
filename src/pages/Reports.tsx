
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Calendar, Users, Download } from "lucide-react";

const Reports = () => {
  const weeklyData = [
    { day: "Mon", covers: 45, revenue: 1250 },
    { day: "Tue", covers: 52, revenue: 1450 },
    { day: "Wed", covers: 38, revenue: 1050 },
    { day: "Thu", covers: 61, revenue: 1680 },
    { day: "Fri", covers: 78, revenue: 2150 },
    { day: "Sat", covers: 89, revenue: 2450 },
    { day: "Sun", covers: 67, revenue: 1850 }
  ];

  const servicePerformance = [
    { service: "Dinner Service", bookings: 156, revenue: 8750, avgParty: 3.2, noShowRate: 5 },
    { service: "Afternoon Tea", bookings: 89, revenue: 2850, avgParty: 2.8, noShowRate: 2 },
    { service: "Sunday Lunch", bookings: 67, revenue: 3200, avgParty: 4.1, noShowRate: 3 }
  ];

  const popularTimes = [
    { time: "18:00", bookings: 23, percentage: 85 },
    { time: "19:00", bookings: 28, percentage: 100 },
    { time: "20:00", bookings: 25, percentage: 92 },
    { time: "21:00", bookings: 18, percentage: 67 }
  ];

  const totalCovers = weeklyData.reduce((sum, day) => sum + day.covers, 0);
  const totalRevenue = weeklyData.reduce((sum, day) => sum + day.revenue, 0);
  const avgPartySize = 3.1;
  const overallNoShowRate = 4.2;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" strokeWidth={2} />
            Export CSV
          </Button>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" strokeWidth={2} />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Covers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCovers}</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" strokeWidth={2} />
              <span>+12% vs last week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" strokeWidth={2} />
              <span>+8% vs last week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Avg Party Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPartySize}</div>
            <p className="text-xs text-muted-foreground">guests per booking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">No-Show Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallNoShowRate}%</div>
            <p className="text-xs text-muted-foreground">industry avg: 6%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Daily covers and revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div key={day.day} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-sm font-medium">{day.day}</div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                      <span className="text-sm">{day.covers} covers</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">£{day.revenue}</div>
                    <div className="text-xs text-muted-foreground">
                      £{Math.round(day.revenue / day.covers)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Performance</CardTitle>
            <CardDescription>Breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {servicePerformance.map((service, index) => (
                <div key={service.service} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">{service.service}</h4>
                    <Badge variant={service.noShowRate < 5 ? "secondary" : "destructive"}>
                      {service.noShowRate}% no-show
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-lg font-bold">{service.bookings}</div>
                      <div className="text-muted-foreground">Bookings</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">£{service.revenue}</div>
                      <div className="text-muted-foreground">Revenue</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{service.avgParty}</div>
                      <div className="text-muted-foreground">Avg Party</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular Time Slots</CardTitle>
          <CardDescription>Booking heatmap by time of day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularTimes.map((slot) => (
              <div key={slot.time} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{slot.time}</span>
                  <span className="text-sm text-muted-foreground">{slot.percentage}%</span>
                </div>
                <div className="text-2xl font-bold mb-1">{slot.bookings}</div>
                <div className="text-xs text-muted-foreground">bookings</div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${slot.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guest Frequency Analysis</CardTitle>
          <CardDescription>Customer return patterns and loyalty metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">68%</div>
              <div className="text-sm text-muted-foreground">Return Rate</div>
              <div className="text-xs text-muted-foreground mt-1">guests who book again</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-secondary">4.2</div>
              <div className="text-sm text-muted-foreground">Avg Visits</div>
              <div className="text-xs text-muted-foreground mt-1">per returning guest</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-accent">£185</div>
              <div className="text-sm text-muted-foreground">Customer LTV</div>
              <div className="text-xs text-muted-foreground mt-1">lifetime value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
