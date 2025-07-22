
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
