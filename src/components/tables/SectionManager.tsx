
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Edit, Trash2, GripVertical, Users, ArrowUp, ArrowDown } from "lucide-react";
import { useSections } from "@/hooks/useSections";
import { useToast } from "@/hooks/use-toast";

interface SectionManagerProps {
  tables: any[];
  setTables: (tables: any[]) => void;
  onEditTable: (table: any) => void;
  onDeleteTable: (tableId: number) => void;
  joinGroups: any[];
}

export const SectionManager = ({ 
  tables, 
  setTables, 
  onEditTable, 
  onDeleteTable, 
  joinGroups 
}: SectionManagerProps) => {
  const { sections, createSection, updateSection, deleteSection, reorderSections } = useSections();
  const { toast } = useToast();
  
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [newSection, setNewSection] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  });

  const handleAddSection = async () => {
    try {
      await createSection(newSection);
      setNewSection({ name: "", description: "", color: "#3B82F6" });
      setShowSectionDialog(false);
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;
    try {
      await updateSection({ id: editingSection.id, updates: editingSection });
      setEditingSection(null);
      setShowSectionDialog(false);
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    const tablesInSection = getTablesForSection(sectionId);
    if (tablesInSection.length > 0) {
      toast({
        title: "Cannot Delete Section",
        description: "Please move or delete all tables from this section first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await deleteSection(sectionId);
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const handleSectionDrop = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order for all sections
    const reorderedSections = items.map((section, index) => ({
      id: section.id,
      sort_order: index + 1
    }));

    try {
      await reorderSections(reorderedSections);
    } catch (error) {
      console.error('Error reordering sections:', error);
    }
  };

  const handleTableDrop = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const tableId = parseInt(draggableId.replace('table-', ''));
    const newSectionId = parseInt(destination.droppableId.replace('section-', ''));

    const updatedTables = tables.map(table =>
      table.id === tableId ? { ...table, sectionId: newSectionId } : table
    );
    setTables(updatedTables);
  };

  const getTablesForSection = (sectionId: number) => {
    return tables.filter(table => table.sectionId === sectionId);
  };

  const currentFormData = editingSection || newSection;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Sections & Tables</h3>
          <p className="text-sm text-muted-foreground">Organize your tables by sections. All tables must be assigned to a section.</p>
        </div>
        <Button onClick={() => setShowSectionDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* Section Ordering */}
      <DragDropContext onDragEnd={handleSectionDrop}>
        <Droppable droppableId="sections-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={`section-${section.id}`} index={index}>
                  {(provided, snapshot) => (
                    <Card 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={snapshot.isDragging ? 'shadow-lg' : ''}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps} className="cursor-move">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>#{section.sort_order}</span>
                              </div>
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: section.color }}
                              />
                              <CardTitle className="text-lg">{section.name}</CardTitle>
                              <Badge variant="outline">
                                {getTablesForSection(section.id).length} tables
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setEditingSection(section);
                                setShowSectionDialog(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteSection(section.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {section.description && (
                          <CardDescription>{section.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <DragDropContext onDragEnd={handleTableDrop}>
                          <Droppable droppableId={`section-${section.id}`}>
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="min-h-20">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {getTablesForSection(section.id).map((table, tableIndex) => (
                                    <Draggable key={table.id} draggableId={`table-${table.id}`} index={tableIndex}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`p-3 border rounded-lg bg-background ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div {...provided.dragHandleProps}>
                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                              <div>
                                                <p className="font-medium">{table.label}</p>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                  <Users className="h-3 w-3" />
                                                  {table.seats} seats
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex gap-1">
                                              <Button variant="ghost" size="sm" onClick={() => onEditTable(table)}>
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => onDeleteTable(table.id)}
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                </div>
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Section Dialog */}
      <Dialog open={showSectionDialog} onOpenChange={(open) => {
        setShowSectionDialog(open);
        if (!open) {
          setEditingSection(null);
          setNewSection({ name: "", description: "", color: "#3B82F6" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sectionName">Section Name *</Label>
              <Input
                id="sectionName"
                value={currentFormData.name}
                onChange={(e) => editingSection
                  ? setEditingSection({...editingSection, name: e.target.value})
                  : setNewSection({...newSection, name: e.target.value})
                }
                placeholder="e.g., Bar Area"
                required
              />
            </div>
            <div>
              <Label htmlFor="sectionDescription">Description</Label>
              <Input
                id="sectionDescription"
                value={currentFormData.description}
                onChange={(e) => editingSection
                  ? setEditingSection({...editingSection, description: e.target.value})
                  : setNewSection({...newSection, description: e.target.value})
                }
                placeholder="e.g., High-top tables near the bar"
              />
            </div>
            <div>
              <Label htmlFor="sectionColor">Color</Label>
              <Input
                id="sectionColor"
                type="color"
                value={currentFormData.color}
                onChange={(e) => editingSection
                  ? setEditingSection({...editingSection, color: e.target.value})
                  : setNewSection({...newSection, color: e.target.value})
                }
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={editingSection ? handleUpdateSection : handleAddSection}>
                {editingSection ? 'Update Section' : 'Add Section'}
              </Button>
              <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
