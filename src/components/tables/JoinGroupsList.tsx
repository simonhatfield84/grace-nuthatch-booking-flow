
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";

interface JoinGroupsListProps {
  joinGroups: any[];
  tables: any[];
  onEditGroup: (group: any) => void;
  onDeleteGroup: (groupId: number) => void;
}

export const JoinGroupsList = ({ joinGroups, tables, onEditGroup, onDeleteGroup }: JoinGroupsListProps) => {
  if (!joinGroups || joinGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table Joins</CardTitle>
          <CardDescription>Tables that can be combined for larger parties</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No table joins configured yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Joins</CardTitle>
        <CardDescription>Tables that can be combined for larger parties</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {joinGroups.map((group) => {
            // Use database field names: table_ids instead of memberTableIds
            const tableIds = group.table_ids || [];
            const maxPartySize = group.max_party_size || 0;
            
            return (
              <div key={group.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{group.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Tables: {tableIds.map((id: number) => 
                      tables.find(t => t.id === id)?.label
                    ).filter(Boolean).join(", ") || "No tables"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {maxPartySize} total seats
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => onEditGroup(group)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
