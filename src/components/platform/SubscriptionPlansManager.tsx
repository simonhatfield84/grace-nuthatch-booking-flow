
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function SubscriptionPlansManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Plans</CardTitle>
        <CardDescription>
          Plan management is temporarily unavailable
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Subscription plan management has been temporarily disabled for system maintenance.
            All existing subscriptions remain active.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
