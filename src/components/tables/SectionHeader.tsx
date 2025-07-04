
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

interface Section {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

interface SectionHeaderProps {
  section: Section;
  tableCount: number;
  onAddTable: (sectionId: number) => void;
  isCollapsed?: boolean;
}

export const SectionHeader = ({ section, tableCount, onAddTable, isCollapsed = false }: SectionHeaderProps) => {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-lg font-semibold">{section.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {tableCount} {tableCount === 1 ? 'table' : 'tables'}
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onAddTable(section.id);
          }}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Table
        </Button>
      </div>
      {section.description && (
        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
      )}
    </CardHeader>
  );
};
