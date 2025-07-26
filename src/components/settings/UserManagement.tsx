
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UserManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage venue users and their permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">User management - to be implemented</p>
        </div>
      </CardContent>
    </Card>
  );
}
