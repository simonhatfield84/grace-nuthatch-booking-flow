
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BookingSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Settings</CardTitle>
        <CardDescription>
          Configure booking rules and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Booking settings - to be implemented</p>
        </div>
      </CardContent>
    </Card>
  );
}
