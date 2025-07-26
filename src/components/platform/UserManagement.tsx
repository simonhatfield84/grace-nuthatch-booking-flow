
import { useState } from "react";
import { usePlatformUsers } from "@/hooks/usePlatformUsers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, Building2, Mail } from "lucide-react";

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users = [], isLoading } = usePlatformUsers();

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.venues?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const roleColors = {
      owner: "bg-purple-100 text-purple-800",
      manager: "bg-blue-100 text-blue-800",
      staff: "bg-green-100 text-green-800",
      host: "bg-orange-100 text-orange-800",
    };
    
    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage platform users and their access across venues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <span className="font-medium">{users.length} Total Users</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Listings</CardTitle>
          <CardDescription>
            View and manage all platform users and their venue associations
          </CardDescription>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name, email, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : user.email.split('@')[0]
                          }
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.venues ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{user.venues.name}</span>
                          <Badge 
                            variant="outline" 
                            className={
                              user.venues.approval_status === 'approved' 
                                ? "border-green-200 text-green-700"
                                : user.venues.approval_status === 'rejected'
                                ? "border-red-200 text-red-700"
                                : "border-yellow-200 text-yellow-700"
                            }
                          >
                            {user.venues.approval_status}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No venue</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.is_active)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.last_login_at 
                          ? new Date(user.last_login_at).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
