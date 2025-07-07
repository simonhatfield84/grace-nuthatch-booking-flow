
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Layout, List } from "lucide-react";
import { SectionManager } from "@/components/tables/SectionManager";
import { FloorPlanCanvas } from "@/components/tables/FloorPlanCanvas";
import { TableDialog } from "@/components/tables/TableDialog";
import { SectionDialog } from "@/components/tables/SectionDialog";
import { GroupDialog } from "@/components/tables/GroupDialog";
import { TableStats } from "@/components/tables/TableStats";
import { BookingPriorityManager } from "@/components/tables/BookingPriorityManager";
import { useTables } from "@/hooks/useTables";
import { useSections } from "@/hooks/useSections";
import { useGroupManagement } from "@/hooks/useGroupManagement";

const Tables = () => {
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("list"); // Default to list view

  const { tables, createTable, updateTable, deleteTable, updateTablePositions } = useTables();
  const { sections, createSection, updateSection, deleteSection } = useSections();
  const { groups, createGroup, updateGroup, deleteGroup } = useGroupManagement();

  const handleCreateTable = () => {
    setEditingTable(null);
    setTableDialogOpen(true);
  };

  const handleEditTable = (table: any) => {
    setEditingTable(table);
    setTableDialogOpen(true);
  };

  const handleCreateSection = () => {
    setEditingSection(null);
    setSectionDialogOpen(true);
  };

  const handleEditSection = (section: any) => {
    setEditingSection(section);
    setSectionDialogOpen(true);
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tables & Floor Plan</h1>
          <p className="text-muted-foreground">Manage your restaurant tables, sections, and seating arrangements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateTable}>
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
          <Button variant="outline" onClick={handleCreateSection}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          <Button variant="outline" onClick={handleCreateGroup}>
            <Plus className="h-4 w-4 mr-2" />
            Add Group
          </Button>
        </div>
      </div>

      <TableStats tables={tables} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="floorplan">
            <Layout className="h-4 w-4 mr-2" />
            Floor Plan
          </TabsTrigger>
          <TabsTrigger value="priorities">
            Booking Priorities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <SectionManager
            sections={sections}
            tables={tables}
            onEditTable={handleEditTable}
            onEditSection={handleEditSection}
            onDeleteSection={deleteSection}
            groups={groups}
            onEditGroup={handleEditGroup}
            onDeleteGroup={deleteGroup}
          />
        </TabsContent>

        <TabsContent value="floorplan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Floor Plan Designer
              </CardTitle>
              <CardDescription>
                Drag and drop tables to design your restaurant layout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FloorPlanCanvas 
                tables={tables}
                sections={sections}
                onUpdatePositions={updateTablePositions}
                onEditTable={handleEditTable}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priorities" className="space-y-6">
          <BookingPriorityManager />
        </TabsContent>
      </Tabs>

      <TableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        table={editingTable}
        sections={sections}
        groups={groups}
        onSave={editingTable ? updateTable : createTable}
        onDelete={editingTable ? () => deleteTable(editingTable.id) : undefined}
      />

      <SectionDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        section={editingSection}
        onSave={editingSection ? updateSection : createSection}
      />

      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={editingGroup}
        tables={tables}
        onSave={editingGroup ? updateGroup : createGroup}
      />
    </div>
  );
};

export default Tables;
