
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Calendar, Users, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { AvailabilityAnalytics } from "@/components/admin/AvailabilityAnalytics";
import PaymentReports from "@/components/reports/PaymentReports";

const Reports = () => {
  const { user } = useAuth();

  // Get user's venue ID
  const { data: userVenue } = useQuery({
    queryKey: ['user-venue', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.venue_id;
    },
    enabled: !!user,
  });

  // Get weekly booking data
  const { data: weeklyBookings } = useQuery({
    queryKey: ['weekly-bookings', userVenue],
    queryFn: async () => {
      if (!userVenue) return [];
      
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date, party_size, status')
        .eq('venue_id', userVenue)
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .in('status', ['confirmed', 'finished']);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userVenue,
  });

  // Get service performance data
  const { data: serviceData } = useQuery({
    queryKey: ['service-performance', userVenue],
    queryFn: async () => {
      if (!userVenue) return [];
      
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('service, party_size, status')
        .eq('venue_id', userVenue)
        .gte('booking_date', thirtyDaysAgo)
        .in('status', ['confirmed', 'finished', 'no_show']);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userVenue,
  });

  // Get guest frequency data
  const { data: guestData } = useQuery({
    queryKey: ['guest-frequency', userVenue],
    queryFn: async () => {
      if (!userVenue) return [];
      
      const { data, error } = await supabase
        .from('guests')
        .select('id, created_at, import_visit_count')
        .eq('venue_id', userVenue);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userVenue,
  });

  // Get popular time slots
  const { data: timeSlotData } = useQuery({
    queryKey: ['time-slots', userVenue],
    queryFn: async () => {
      if (!userVenue) return [];
      
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('venue_id', userVenue)
        .gte('booking_date', thirtyDaysAgo)
        .in('status', ['confirmed', 'finished']);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userVenue,
  });

  // Process weekly data
  const weeklyData = React.useMemo(() => {
    if (!weeklyBookings) return [];
    
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayBookings = weeklyBookings.filter(b => b.booking_date === dayStr);
      const covers = dayBookings.reduce((sum, b) => sum + b.party_size, 0);
      
      return {
        day: format(day, 'EEE'),
        covers,
        revenue: covers * 35 // Estimated £35 per cover
      };
    });
  }, [weeklyBookings]);

  // Process service performance
  const servicePerformance = React.useMemo(() => {
    if (!serviceData) return [];
    
    const serviceGroups = serviceData.reduce((acc, booking) => {
      const service = booking.service || 'Unknown Service';
      if (!acc[service]) {
        acc[service] = { bookings: 0, totalGuests: 0, noShows: 0 };
      }
      acc[service].bookings++;
      acc[service].totalGuests += booking.party_size;
      if (booking.status === 'no_show') acc[service].noShows++;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(serviceGroups).map(([service, data]) => ({
      service,
      bookings: data.bookings,
      revenue: data.totalGuests * 35, // Estimated £35 per cover
      avgParty: Math.round((data.totalGuests / data.bookings) * 10) / 10,
      noShowRate: Math.round((data.noShows / data.bookings) * 100)
    }));
  }, [serviceData]);

  // Process popular times
  const popularTimes = React.useMemo(() => {
    if (!timeSlotData) return [];
    
    const timeGroups = timeSlotData.reduce((acc, booking) => {
      const hour = booking.booking_time.substring(0, 5); // Get HH:MM
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedTimes = Object.entries(timeGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4);

    const maxBookings = Math.max(...sortedTimes.map(([,count]) => count));

    return sortedTimes.map(([time, bookings]) => ({
      time,
      bookings,
      percentage: Math.round((bookings / maxBookings) * 100)
    }));
  }, [timeSlotData]);

  // Calculate totals
  const totalCovers = weeklyData.reduce((sum, day) => sum + day.covers, 0);
  const totalRevenue = weeklyData.reduce((sum, day) => sum + day.revenue, 0);
  const avgPartySize = servicePerformance.length > 0 
    ? Math.round(servicePerformance.reduce((sum, s) => sum + s.avgParty, 0) / servicePerformance.length * 10) / 10
    : 0;
  const overallNoShowRate = servicePerformance.length > 0
    ? Math.round(servicePerformance.reduce((sum, s) => sum + s.noShowRate, 0) / servicePerformance.length * 10) / 10
    : 0;

  // Calculate guest metrics
  const returnRate = guestData && guestData.length > 0 
    ? Math.round((guestData.filter(g => (g.import_visit_count || 0) > 1).length / guestData.length) * 100)
    : 0;

  if (!userVenue) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading venue data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance insights</p>
        </div>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="availability">Availability API</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Covers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCovers || 'Not enough data'}</div>
            {totalCovers > 0 && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" strokeWidth={2} />
                <span>Current week</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue > 0 ? `£${totalRevenue.toLocaleString()}` : 'Not enough data'}
            </div>
            {totalRevenue > 0 && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" strokeWidth={2} />
                <span>Estimated</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Avg Party Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPartySize || 'Not enough data'}</div>
            {avgPartySize > 0 && <p className="text-xs text-muted-foreground">guests per booking</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">No-Show Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallNoShowRate ? `${overallNoShowRate}%` : 'Not enough data'}</div>
            {overallNoShowRate > 0 && <p className="text-xs text-muted-foreground">industry avg: 6%</p>}
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
            {weeklyData.length > 0 ? (
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
                      {day.covers > 0 && (
                        <div className="text-xs text-muted-foreground">
                          £{Math.round(day.revenue / day.covers)} avg
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Not enough data</p>
                <p className="text-sm">Add some bookings to see weekly performance</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Performance</CardTitle>
            <CardDescription>Breakdown by service type (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {servicePerformance.length > 0 ? (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Not enough data</p>
                <p className="text-sm">Add some bookings to see service performance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {popularTimes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Time Slots</CardTitle>
            <CardDescription>Booking heatmap by time of day (last 30 days)</CardDescription>
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>Guest Frequency Analysis</CardTitle>
          <CardDescription>Customer return patterns and loyalty metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {guestData && guestData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{returnRate}%</div>
                <div className="text-sm text-muted-foreground">Return Rate</div>
                <div className="text-xs text-muted-foreground mt-1">guests who book again</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {guestData.length > 0 
                    ? Math.round(guestData.reduce((sum, g) => sum + (g.import_visit_count || 1), 0) / guestData.length * 10) / 10
                    : 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg Visits</div>
                <div className="text-xs text-muted-foreground mt-1">per guest</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-accent">Not calculated</div>
                <div className="text-sm text-muted-foreground">Customer LTV</div>
                <div className="text-xs text-muted-foreground mt-1">needs more data</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Not enough data</p>
              <p className="text-sm">Add some guests to see frequency analysis</p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="payments">
          <PaymentReports />
        </TabsContent>

        <TabsContent value="availability">
          {userVenue && <AvailabilityAnalytics venueId={userVenue} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
