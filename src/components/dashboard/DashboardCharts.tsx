import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDashboardKPIs } from "@/hooks/useDashboardKPIs";
import { useServices } from "@/hooks/useServices";
import { useBookings } from "@/hooks/useBookings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WifiAnalyticsDashboard } from '@/components/wifi/WifiAnalyticsDashboard';

export const DashboardCharts = () => {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { services, isLoading: servicesLoading } = useServices();
  const { bookings, isLoading: bookingsLoading } = useBookings();

  // Prepare service data for the chart
  const serviceData = services?.map((service) => {
    const bookingCount = bookings?.filter(
      (booking) => booking.service_id === service.id
    ).length;
    return { name: service.name, bookings: bookingCount || 0 };
  });

  // Prepare booking source data for the chart
  const bookingSourceData = [
    { name: "Widget", bookings: kpis?.widget_bookings_count || 0 },
    { name: "Manual", bookings: kpis?.manual_bookings_count || 0 },
  ];

  // Prepare trends data for the chart
  const trendsData = kpis?.daily_revenue?.map((item) => ({
    date: item.date,
    revenue: item.revenue,
  }));

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="wifi">WiFi Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Source Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Source</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="bookings"
                      data={bookingSourceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {bookingSourceData?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Service Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Bookings by Service</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Popularity</CardTitle>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <p>Loading services...</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={serviceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <p>Loading trends...</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wifi" className="space-y-6">
          <WifiAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
