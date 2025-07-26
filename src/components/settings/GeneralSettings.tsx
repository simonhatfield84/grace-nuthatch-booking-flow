
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function GeneralSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Manage your venue's general settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">General settings - to be implemented</p>
        </div>
      </CardContent>
    </Card>
  );
}
