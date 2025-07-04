
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
      <div className="text-center py-8 text-muted-foreground">
        <p>No tables in this section yet.</p>
        <p className="text-sm">Add a table to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tables.map((table) => (
        <div key={table.id} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-accent/5 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-base">{table.label}</span>
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {table.seats} seats
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {table.online_bookable ? (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Online Bookable
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Not Bookable
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs">
                Priority #{table.priority_rank}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditTable(table)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDeleteTable(table.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
