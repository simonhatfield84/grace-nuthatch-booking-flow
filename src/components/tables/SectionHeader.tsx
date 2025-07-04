
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SectionHeaderProps {
  section: {
    id: number;
    name: string;
    color: string;
  };
  tableCount: number;
  onAddTable: (sectionId: number) => void;
}

export const SectionHeader = ({ section, tableCount, onAddTable }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: section.color }}
        />
        <h3 className="text-lg font-semibold text-foreground">
          {section.name}
        </h3>
        <Badge variant="outline" className="text-sm">
          {tableCount} table{tableCount !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onAddTable(section.id)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add table to {section.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
