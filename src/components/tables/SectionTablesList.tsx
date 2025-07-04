
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, Check, X } from "lucide-react";
import { Table } from "@/hooks/useTables";

interface SectionTablesListProps {
  tables: Table[];
  onEditTable: (table: Table) => void;
  onDeleteTable: (tableId: number) => void;
}

export const SectionTablesList = ({ tables, onEditTable, onDeleteTable }: SectionTablesListProps) => {
  if (tables.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">No tables in this section yet.</p>
        <p className="text-xs text-muted-foreground/70">Add a table to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tables.map((table) => (
        <div key={table.id} className="flex items-center justify-between p-2 border rounded-md bg-background hover:bg-accent/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{table.label}</span>
              <Badge variant="outline" className="text-xs px-2 py-0">
                <Users className="h-3 w-3 mr-1" />
                {table.seats}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              {table.online_bookable ? (
                <Badge variant="default" className="text-xs px-2 py-0 bg-green-100 text-green-800 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  <X className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs px-2 py-0">
                #{table.priority_rank}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditTable(table)}
              className="h-7 w-7 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDeleteTable(table.id)}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
