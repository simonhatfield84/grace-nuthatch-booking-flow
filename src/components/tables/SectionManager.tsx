
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SectionHeader } from "./SectionHeader";
import { SectionTablesList } from "./SectionTablesList";
import { useSections } from "@/hooks/useSections";
import { Table } from "@/hooks/useTables";

interface SectionManagerProps {
  tables: Table[];
  onEditTable: (table: Table) => void;
  onDeleteTable: (tableId: number) => void;
  onAddTableToSection?: (sectionId: number) => void;
  onEditSection: (section: any) => void;
  onDeleteSection: (sectionId: number) => void;
}

export const SectionManager = ({ 
  tables, 
  onEditTable, 
  onDeleteTable,
  onAddTableToSection,
  onEditSection,
  onDeleteSection
}: SectionManagerProps) => {
  const { sections } = useSections();
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());

  // Initialize all sections as collapsed by default
  useEffect(() => {
    if (sections.length > 0) {
      setCollapsedSections(new Set(sections.map(s => s.id)));
    }
  }, [sections]);

  const getTablesForSection = (sectionId: number) => {
    return tables.filter(table => table.section_id === sectionId);
  };

  const handleAddTable = (sectionId: number) => {
    if (onAddTableToSection) {
      onAddTableToSection(sectionId);
    }
  };

  const toggleSection = (sectionId: number) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const sectionTables = getTablesForSection(section.id);
        const isCollapsed = collapsedSections.has(section.id);
        
        return (
          <Card key={section.id} className="overflow-hidden">
            <Collapsible open={!isCollapsed} onOpenChange={() => toggleSection(section.id)}>
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer">
                  <SectionHeader 
                    section={section}
                    tableCount={sectionTables.length}
                    onAddTable={handleAddTable}
                    onEditSection={onEditSection}
                    onDeleteSection={onDeleteSection}
                    isCollapsed={isCollapsed}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-3">
                  <SectionTablesList
                    tables={sectionTables}
                    onEditTable={onEditTable}
                    onDeleteTable={onDeleteTable}
                  />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
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
