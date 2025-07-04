
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "./SectionHeader";
import { SectionTablesList } from "./SectionTablesList";
import { useSections } from "@/hooks/useSections";
import { Table } from "@/hooks/useTables";

interface SectionManagerProps {
  tables: Table[];
  onEditTable: (table: Table) => void;
  onDeleteTable: (tableId: number) => void;
  onAddTableToSection?: (sectionId: number) => void;
}

export const SectionManager = ({ 
  tables, 
  onEditTable, 
  onDeleteTable,
  onAddTableToSection 
}: SectionManagerProps) => {
  const { sections } = useSections();

  const getTablesForSection = (sectionId: number) => {
    return tables.filter(table => table.section_id === sectionId);
  };

  const handleAddTable = (sectionId: number) => {
    if (onAddTableToSection) {
      onAddTableToSection(sectionId);
    }
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const sectionTables = getTablesForSection(section.id);
        
        return (
          <Card key={section.id} className="overflow-hidden">
            <SectionHeader 
              section={section}
              tableCount={sectionTables.length}
              onAddTable={handleAddTable}
            />
            <CardContent className="p-4">
              <SectionTablesList
                tables={sectionTables}
                onEditTable={onEditTable}
                onDeleteTable={onDeleteTable}
              />
            </CardContent>
          </Card>
        );
      })}
      
      {sections.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No sections created yet.</p>
          <p className="text-sm">Create a section first to organize your tables.</p>
        </div>
      )}
    </div>
  );
};
