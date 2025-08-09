
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface ServicePopularityProps {
  data: Record<string, number>;
}

export const ServicePopularityChart = ({ data }: ServicePopularityProps) => {
  const chartData = Object.entries(data).map(([service, count]) => ({
    service,
    count,
    fill: service === 'Dinner' ? '#D87C5A' : service === 'Afternoon Tea' ? '#E9A036' : '#3B82F6'
  }));

  const chartConfig = {
    count: {
      label: "Bookings",
    },
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Popularity</CardTitle>
          <CardDescription>This week's bookings by service</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Popularity</CardTitle>
        <CardDescription>This week's bookings by service</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[12rem] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

interface StatusBreakdownProps {
  data: Record<string, number>;
}

export const StatusBreakdownChart = ({ data }: StatusBreakdownProps) => {
  const chartData = Object.entries(data).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    fill: status === 'confirmed' ? '#D87C5A' : 
          status === 'seated' ? '#22C55E' : 
          status === 'finished' ? '#3B82F6' : '#EF4444'
  }));

  const chartConfig = {
    count: {
      label: "Bookings",
    },
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Status</CardTitle>
          <CardDescription>Booking status breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          No bookings today
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Status</CardTitle>
        <CardDescription>Booking status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[12rem] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="status" />
              <YAxis />
              <Bar dataKey="count" radius={4} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
