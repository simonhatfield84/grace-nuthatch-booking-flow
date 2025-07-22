
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Users } from "lucide-react";

interface AlertsPanelProps {
  unallocatedBookings: any[];
  tableUtilization: number;
}

export const AlertsPanel = ({ unallocatedBookings, tableUtilization }: AlertsPanelProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          
          {/* Unallocated Bookings Alert */}
          {unallocatedBookings.length > 0 && (
            <div className="flex items-center justify-between p-3 border rounded-lg border-warning/20 bg-warning/5">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-warning" />
                <span className="font-medium">Unallocated Bookings</span>
              </div>
              <Badge variant="outline" className="text-warning border-warning">
                {unallocatedBookings.length} bookings
              </Badge>
            </div>
          )}

          {/* Table Utilization Alert */}
          {tableUtilization > 85 && (
            <div className="flex items-center justify-between p-3 border rounded-lg border-destructive/20 bg-destructive/5">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-destructive" />
                <span className="font-medium">High Table Utilization</span>
              </div>
              <Badge variant="destructive">
                {tableUtilization}%
              </Badge>
            </div>
          )}

          {unallocatedBookings.length === 0 && tableUtilization <= 85 && (
            <p className="text-muted-foreground text-center py-4">
              No alerts at this time
            </p>
          )}

        </CardContent>
      </Card>
    </div>
  );
};
