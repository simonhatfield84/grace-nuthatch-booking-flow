
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformVenues() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Venue Management</h1>
        <p className="text-muted-foreground">
          Manage all venues on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Management</CardTitle>
          <CardDescription>
            Comprehensive venue management tools will be available here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Phase 2 - venue listing, approval workflow, suspension controls
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
