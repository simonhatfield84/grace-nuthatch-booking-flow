
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableStats } from "@/components/tables/TableStats";
import { TableDialog } from "@/components/tables/TableDialog";
import { GroupDialog } from "@/components/tables/GroupDialog";
import { JoinGroupsList } from "@/components/tables/JoinGroupsList";
import { SectionManager } from "@/components/tables/SectionManager";
import { BookingPriorityManager } from "@/components/tables/BookingPriorityManager";
import { useTableManagement } from "@/hooks/useTableManagement";
import { useGroupManagement } from "@/hooks/useGroupManagement";

const Tables = () => {
  const {
    tables,
    editingTable,
    setEditingTable,
    newTable,
    setNewTable,
    handleAddTable,
    handleUpdateTable,
    handleDeleteTable,
    handleEditTable,
    resetTableForm
  } = useTableManagement();

  const {
    joinGroups,
    editingGroup,
    setEditingGroup,
    newGroup,
    setNewGroup,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleEditGroup,
    resetGroupForm
  } = useGroupManagement([], tables, () => {});

  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [showEditTableDialog, setShowEditTableDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [preSelectedSectionId, setPreSelectedSectionId] = useState<number | null>(null);

  const handleEditTableClick = (table: any) => {
    handleEditTable(table);
    setShowEditTableDialog(true);
  };

  const handleUpdateTableWithClose = async () => {
    await handleUpdateTable();
    setShowEditTableDialog(false);
  };

  const handleAddTableToSection = (sectionId: number) => {
    setPreSelectedSectionId(sectionId);
    setNewTable(prev => ({ ...prev, section_id: sectionId }));
    setShowAddTableDialog(true);
  };

  const handleGlobalAddTable = () => {
    setPreSelectedSectionId(null);
    setShowAddTableDialog(true);
  };

  const handleAddTableWithClose = async () => {
    await handleAddTable();
    setShowAddTableDialog(false);
    setPreSelectedSectionId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tables</h1>
          <p className="text-muted-foreground">Manage your venue's table layout, sections, and booking priorities</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGlobalAddTable}>
            <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
            Add Table
          </Button>
          <Button variant="outline" onClick={() => setShowAddGroupDialog(true)}>
            <Link className="h-4 w-4 mr-2" strokeWidth={2} />
            Create Group
          </Button>
        </div>
      </div>

      <TableStats />

      <Tabs defaultValue="layout" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="layout">Layout & Sections</TabsTrigger>
          <TabsTrigger value="priority">Booking Priority</TabsTrigger>
          <TabsTrigger value="groups">Join Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-6">
          <SectionManager
            tables={tables}
            onEditTable={handleEditTableClick}
            onDeleteTable={handleDeleteTable}
            onAddTableToSection={handleAddTableToSection}
          />
        </TabsContent>

        <TabsContent value="priority" className="space-y-6">
          <BookingPriorityManager
            tables={tables}
            joinGroups={joinGroups}
          />
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <JoinGroupsList 
            joinGroups={joinGroups} 
            tables={tables} 
            onEditGroup={handleEditGroup} 
            onDeleteGroup={handleDeleteGroup} 
          />
        </TabsContent>
      </Tabs>

      <TableDialog 
        isOpen={showAddTableDialog} 
        onOpenChange={(open) => {
          setShowAddTableDialog(open);
          if (!open) {
            resetTableForm();
            setPreSelectedSectionId(null);
          }
        }} 
        editingTable={null}
        newTable={newTable} 
        setNewTable={setNewTable} 
        setEditingTable={setEditingTable}
        onAddTable={handleAddTableWithClose} 
        onUpdateTable={handleUpdateTable}
        preSelectedSectionId={preSelectedSectionId}
      />

      <TableDialog 
        isOpen={showEditTableDialog} 
        onOpenChange={(open) => {
          setShowEditTableDialog(open);
          if (!open) {
            setEditingTable(null);
            resetTableForm();
          }
        }} 
        editingTable={editingTable}
        newTable={newTable} 
        setNewTable={setNewTable} 
        setEditingTable={setEditingTable}
        onAddTable={handleAddTable} 
        onUpdateTable={handleUpdateTableWithClose} 
      />

      <GroupDialog 
        isOpen={showAddGroupDialog} 
        onOpenChange={(open) => {
          setShowAddGroupDialog(open);
          if (!open) resetGroupForm();
        }} 
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
