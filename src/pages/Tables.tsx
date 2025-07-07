
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
  const {
    joinGroups,
    editingGroup: groupEditingState,
    setEditingGroup: setGroupEditingState,
    newGroup,
    setNewGroup,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleEditGroup,
    resetGroupForm
  } = useGroupManagement([], tables, updateTable);

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
            tables={tables}
            onEditTable={handleEditTable}
            onDeleteTable={deleteTable}
            onAddTableToSection={handleCreateTable}
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
                onUpdatePositions={updateTablePositions}
                onEditTable={handleEditTable}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priorities" className="space-y-6">
          <BookingPriorityManager tables={tables} joinGroups={joinGroups} />
        </TabsContent>
      </Tabs>

      <TableDialog
        isOpen={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        editingTable={editingTable}
        newTable={{
          label: "",
          seats: 2,
          online_bookable: true,
          priority_rank: 1,
          section_id: null,
          position_x: 100,
          position_y: 100,
          join_groups: []
        }}
        setNewTable={() => {}}
        setEditingTable={setEditingTable}
        onAddTable={async () => {
          if (editingTable) {
            await updateTable({ id: editingTable.id, updates: editingTable });
          } else {
            await createTable({
              label: "",
              seats: 2,
              online_bookable: true,
              priority_rank: tables.length + 1,
              section_id: null,
              position_x: 100,
              position_y: 100,
              join_groups: []
            });
          }
        }}
        onUpdateTable={async () => {
          if (editingTable) {
            await updateTable({ id: editingTable.id, updates: editingTable });
          }
        }}
      />

      <SectionDialog
        isOpen={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        editingSection={editingSection}
        onSectionSaved={() => {
          setSectionDialogOpen(false);
          setEditingSection(null);
        }}
      />

      <GroupDialog
        isOpen={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        editingGroup={editingGroup}
        newGroup={newGroup}
        setNewGroup={setNewGroup}
        setEditingGroup={setEditingGroup}
        onAddGroup={handleAddGroup}
        onUpdateGroup={handleUpdateGroup}
        tables={tables}
      />
    </div>
  );
};

export default Tables;
