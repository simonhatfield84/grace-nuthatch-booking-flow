import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, List, Link } from "lucide-react";
import { SectionManager } from "@/components/tables/SectionManager";
import { TableDialog } from "@/components/tables/TableDialog";
import { SectionDialog } from "@/components/tables/SectionDialog";
import { GroupDialog } from "@/components/tables/GroupDialog";
import { TableStats } from "@/components/tables/TableStats";
import { BookingPriorityManager } from "@/components/tables/BookingPriorityManager";
import { JoinGroupsList } from "@/components/tables/JoinGroupsList";
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
  const [activeTab, setActiveTab] = useState("table-list");
  const [preSelectedSectionId, setPreSelectedSectionId] = useState<number | null>(null);

  const { tables, createTable, updateTable, deleteTable } = useTables();
  const { sections, createSection, updateSection, deleteSection } = useSections();
  
  // Initialize newTable with proper defaults
  const [newTable, setNewTable] = useState({
    label: "",
    seats: 2,
    online_bookable: true,
    priority_rank: 1,
    section_id: null as number | null,
    position_x: 100,
    position_y: 100,
    join_groups: [] as number[]
  });

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

  const resetTableForm = () => {
    const maxPriority = Math.max(...tables.map(t => t.priority_rank), 0);
    setNewTable({
      label: "",
      seats: 2,
      online_bookable: true,
      priority_rank: maxPriority + 1,
      section_id: preSelectedSectionId,
      position_x: 100,
      position_y: 100,
      join_groups: []
    });
  };

  const handleCreateTable = (sectionId?: number) => {
    setEditingTable(null);
    setPreSelectedSectionId(sectionId || null);
    
    // Reset and prepare the form with pre-selected section if provided
    const maxPriority = Math.max(...tables.map(t => t.priority_rank), 0);
    setNewTable({
      label: "",
      seats: 2,
      online_bookable: true,
      priority_rank: maxPriority + 1,
      section_id: sectionId || null,
      position_x: 100,
      position_y: 100,
      join_groups: []
    });
    
    setTableDialogOpen(true);
  };

  const handleEditTable = (table: any) => {
    setEditingTable(table);
    setPreSelectedSectionId(null);
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

  const handleEditGroupLocal = (group: any) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const handleAddTable = async () => {
    try {
      const tableData = editingTable || newTable;
      if (!tableData.section_id) {
        throw new Error("Section is required");
      }
      if (!tableData.label.trim()) {
        throw new Error("Table label is required");
      }

      if (editingTable) {
        await updateTable({ id: editingTable.id, updates: editingTable });
      } else {
        await createTable(newTable);
      }
      
      setTableDialogOpen(false);
      setEditingTable(null);
      setPreSelectedSectionId(null);
      resetTableForm();
    } catch (error) {
      throw error; // Let the dialog handle the error display
    }
  };

  const handleTableDialogClose = (open: boolean) => {
    setTableDialogOpen(open);
    if (!open) {
      setEditingTable(null);
      setPreSelectedSectionId(null);
      resetTableForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tables Management</h1>
          <p className="text-muted-foreground">Manage your restaurant tables, sections, and seating arrangements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleCreateTable()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
          <Button variant="outline" onClick={handleCreateSection}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          <Button variant="outline" onClick={handleCreateGroup}>
            <Plus className="h-4 w-4 mr-2" />
            Add Join
          </Button>
        </div>
      </div>

      <TableStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="table-list">
            <List className="h-4 w-4 mr-2" />
            Table List
          </TabsTrigger>
          <TabsTrigger value="joins">
            <Link className="h-4 w-4 mr-2" />
            Table Joins
          </TabsTrigger>
          <TabsTrigger value="priorities">
            Booking Priorities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table-list" className="space-y-6">
          <SectionManager
            tables={tables}
            onEditTable={handleEditTable}
            onDeleteTable={deleteTable}
            onAddTableToSection={handleCreateTable}
            onEditSection={handleEditSection}
            onDeleteSection={deleteSection}
          />
        </TabsContent>

        <TabsContent value="joins" className="space-y-6">
          <JoinGroupsList />
        </TabsContent>

        <TabsContent value="priorities" className="space-y-6">
          <BookingPriorityManager />
        </TabsContent>
      </Tabs>

      <TableDialog
        isOpen={tableDialogOpen}
        onOpenChange={handleTableDialogClose}
        editingTable={editingTable}
        newTable={newTable}
        setNewTable={setNewTable}
        setEditingTable={setEditingTable}
        onAddTable={handleAddTable}
        onUpdateTable={handleAddTable}
        preSelectedSectionId={preSelectedSectionId}
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
