
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function SubscriptionOverview() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Subscription and payment features are temporarily unavailable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The payment and subscription system has been temporarily disabled for maintenance. 
              All venues continue to operate normally without payment processing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
