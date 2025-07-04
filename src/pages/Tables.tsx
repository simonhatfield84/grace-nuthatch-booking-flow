import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableStats } from "@/components/tables/TableStats";
import { TableDialog } from "@/components/tables/TableDialog";
import { GroupDialog } from "@/components/tables/GroupDialog";
import { JoinGroupsList } from "@/components/tables/JoinGroupsList";
import { EnhancedSectionManager } from "@/components/tables/EnhancedSectionManager";
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
    resetTableForm,
    updateTable
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
  } = useGroupManagement([], tables, updateTable);

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

  const handleUpdateTablePosition = async (tableId: number, x: number, y: number) => {
    try {
      await updateTable({
        id: tableId,
        updates: {
          position_x: x,
          position_y: y
        }
      });
    } catch (error) {
      console.error('Failed to update table position:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tables & Floor Plan</h1>
          <p className="text-muted-foreground">Design your venue layout and manage table configurations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGlobalAddTable}>
            <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
            Add Table
          </Button>
          <Button variant="outline" onClick={() => setShowAddGroupDialog(true)}>
            <Link className="h-4 w-4 mr-2" strokeWidth={2} />
            Create Table Join
          </Button>
        </div>
      </div>

      <TableStats />

      <Tabs defaultValue="floor-plan" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="floor-plan">Floor Plan & Layout</TabsTrigger>
          <TabsTrigger value="priority">Booking Priority</TabsTrigger>
          <TabsTrigger value="groups">Table Joins</TabsTrigger>
        </TabsList>

        <TabsContent value="floor-plan" className="space-y-6">
          <EnhancedSectionManager
            tables={tables}
            onEditTable={handleEditTableClick}
            onDeleteTable={handleDeleteTable}
            onAddTableToSection={handleAddTableToSection}
            onUpdateTablePosition={handleUpdateTablePosition}
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
