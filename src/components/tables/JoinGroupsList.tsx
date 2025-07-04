
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
  if (joinGroups.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Joins</CardTitle>
        <CardDescription>Tables that can be combined for larger parties</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {joinGroups.map((group) => (
            <div key={group.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{group.name}</p>
                <p className="text-sm text-muted-foreground">
                  Tables: {group.memberTableIds.map((id: number) => 
                    tables.find(t => t.id === id)?.label
                  ).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {group.maxCapacity} total seats
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
