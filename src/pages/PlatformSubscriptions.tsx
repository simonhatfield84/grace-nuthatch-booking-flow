
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformSubscriptions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage billing and subscriptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Stripe integration and billing management tools will be available here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Phase 3 - Stripe integration, plan management, billing oversight
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
