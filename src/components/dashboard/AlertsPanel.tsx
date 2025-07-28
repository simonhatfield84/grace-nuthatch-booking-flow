
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface UnallocatedBooking {
  id: number;
  guest_name: string;
  booking_time: string;
  party_size: number;
  service: string;
}

interface AlertsPanelProps {
  unallocatedBookings: UnallocatedBooking[];
  tableUtilization: number;
}

export const AlertsPanel = ({ unallocatedBookings, tableUtilization }: AlertsPanelProps) => {
  const hasAlerts = unallocatedBookings.length > 0 || tableUtilization > 80;

  if (!hasAlerts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            All Systems Good
          </CardTitle>
          <CardDescription>No immediate attention required</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All bookings are allocated and capacity looks healthy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Requires Attention
        </CardTitle>
        <CardDescription>Issues that need immediate action</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {unallocatedBookings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  {unallocatedBookings.length} unallocated booking{unallocatedBookings.length > 1 ? 's' : ''} for today
                </span>
                <Link to="/host">
                  <Button variant="outline" size="sm">
                    Allocate Tables
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {tableUtilization > 80 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>High table utilization ({tableUtilization}%)</span>
                <Badge variant="secondary">{tableUtilization}%</Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {unallocatedBookings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Unallocated Bookings:</h4>
            {unallocatedBookings.slice(0, 3).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                <div>
                  <span className="font-medium">{booking.guest_name}</span>
                  <span className="text-muted-foreground ml-2">
                    {booking.booking_time} • {booking.party_size} guests
                  </span>
                </div>
                <Badge variant="outline">{booking.service}</Badge>
              </div>
            ))}
            {unallocatedBookings.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{unallocatedBookings.length - 3} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
