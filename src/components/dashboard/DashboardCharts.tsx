
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const DashboardCharts = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Booking Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Charts will be implemented here</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Revenue charts will be implemented here</p>
        </CardContent>
      </Card>
    </div>
  );
};

export const ServicePopularityChart = ({ data }: { data?: Record<string, number> }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Popularity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Service popularity chart will be implemented here</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const StatusBreakdownChart = ({ data }: { data?: Record<string, number> }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Status breakdown chart will be implemented here</p>
        </div>
      </CardContent>
    </Card>
  );
};
