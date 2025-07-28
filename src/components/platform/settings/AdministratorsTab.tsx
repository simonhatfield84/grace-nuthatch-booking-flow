
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users } from "lucide-react";
import { usePlatformAdmins } from "@/hooks/usePlatformSettings";

export function AdministratorsTab() {
  const { data: admins = [] } = usePlatformAdmins();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Platform Administrators
        </CardTitle>
        <CardDescription>
          Manage users with platform-wide administrative access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {admins.length > 0 ? (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium">Platform Administrator</div>
                      <div className="text-sm text-muted-foreground">
                        User ID: {admin.user_id}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={admin.is_active ? "default" : "secondary"}>
                      {admin.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No administrators configured</p>
          )}
          
          <Button variant="outline" className="w-full">
            Add New Administrator
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
