
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Eye, EyeOff, LayoutGrid, Edit, Trash2 } from "lucide-react";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { SectionTablesList } from "./SectionTablesList";
import { Table } from "@/hooks/useTables";
import { useSections } from "@/hooks/useSections";

interface EnhancedSectionManagerProps {
  tables: Table[];
  onEditTable: (table: Table) => void;
  onDeleteTable: (tableId: number) => void;
  onAddTableToSection?: (sectionId: number) => void;
  onUpdateTablePosition: (tableId: number, x: number, y: number) => void;
  onEditSection?: (section: any) => void;
  onDeleteSection?: (sectionId: number) => void;
  onCreateSection?: () => void;
}

export const EnhancedSectionManager = ({
  tables,
  onEditTable,
  onDeleteTable,
  onAddTableToSection,
  onUpdateTablePosition,
  onEditSection,
  onDeleteSection,
  onCreateSection
}: EnhancedSectionManagerProps) => {
  const { sections } = useSections();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<'floor-plan' | 'list'>('floor-plan');
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set(sections.map(s => s.id)));

  const getTablesForSection = (sectionId: number) => {
    return tables.filter(table => table.section_id === sectionId);
  };

  const toggleSectionVisibility = (sectionId: number) => {
    const newVisible = new Set(visibleSections);
    if (newVisible.has(sectionId)) {
      newVisible.delete(sectionId);
    } else {
      newVisible.add(sectionId);
    }
    setVisibleSections(newVisible);
  };

  const handleAddTable = (sectionId: number) => {
    if (onAddTableToSection) {
      onAddTableToSection(sectionId);
    }
  };

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No sections created yet</h3>
        <p className="text-sm mb-4">Create sections to organize your tables and design your floor plan.</p>
        <Button variant="outline" onClick={onCreateSection}>
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Section
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Floor Plan Management</h3>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'floor-plan' | 'list')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="floor-plan" className="text-xs">Floor Plan</TabsTrigger>
              <TabsTrigger value="list" className="text-xs">List View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={visibleSections.has(section.id) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSectionVisibility(section.id)}
              className="text-xs"
            >
              {visibleSections.has(section.id) ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
              {section.name}
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTablesForSection(section.id).length}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {viewMode === 'floor-plan' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <FloorPlanCanvas
                  tables={tables.filter(t => visibleSections.has(t.section_id || 0))}
                  onUpdateTablePosition={onUpdateTablePosition}
                  onTableSelect={setSelectedTable}
                  selectedTable={selectedTable}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            {selectedTable && (
              <Card>
                <CardHeader className="pb-3">
                  <h4 className="font-medium">Selected Table</h4>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-lg font-semibold">{selectedTable.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedTable.seats} seats • Priority #{selectedTable.priority_rank}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {selectedTable.online_bookable ? (
                      <Badge variant="default" className="text-xs">Online Bookable</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Offline Only</Badge>
                    )}
                    
                    {selectedTable.join_groups && selectedTable.join_groups.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {selectedTable.join_groups.length} Groups
                      </Badge>
                    )}
                  </div>
                  
                  <div className="pt-2 space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => onEditTable(selectedTable)}
                    >
                      <Settings className="h-3 w-3 mr-2" />
                      Edit Table
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={() => onDeleteTable(selectedTable.id)}
                    >
                      Delete Table
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <h4 className="font-medium">Section Management</h4>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={onCreateSection}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Create New Section
                </Button>
                
                <div className="space-y-1">
                  {sections.map((section) => (
                    <div key={section.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: section.color }}
                        />
                        <span className="text-sm truncate">{section.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditSection?.(section)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteSection?.(section.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <h4 className="font-medium">Quick Actions</h4>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.filter(s => visibleSections.has(s.id)).map((section) => (
                  <Button
                    key={section.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleAddTable(section.id)}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Add to {section.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.filter(s => visibleSections.has(s.id)).map((section) => {
            const sectionTables = getTablesForSection(section.id);
            
            return (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: section.color }}
                      />
                      <h4 className="font-medium">{section.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {sectionTables.length} tables
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddTable(section.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Table
                    </Button>
                  </div>
                  {section.description && (
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <SectionTablesList
                    tables={sectionTables}
                    onEditTable={onEditTable}
                    onDeleteTable={onDeleteTable}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
