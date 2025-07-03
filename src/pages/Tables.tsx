
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Link } from "lucide-react";
import { TableList } from "@/components/TableList";
import { TableStats } from "@/components/tables/TableStats";
import { TableDialog } from "@/components/tables/TableDialog";
import { GroupDialog } from "@/components/tables/GroupDialog";
import { JoinGroupsList } from "@/components/tables/JoinGroupsList";
import { useTableManagement } from "@/hooks/useTableManagement";
import { useGroupManagement } from "@/hooks/useGroupManagement";

const Tables = () => {
  const initialTables = [
    { id: 1, label: "T1", seats: 2, onlineBookable: true, priorityRank: 1, joinGroups: [], position: { x: 100, y: 100 } },
    { id: 2, label: "T2", seats: 2, onlineBookable: true, priorityRank: 2, joinGroups: [1, 2], position: { x: 200, y: 100 } },
    { id: 3, label: "T3", seats: 4, onlineBookable: true, priorityRank: 3, joinGroups: [1, 2], position: { x: 100, y: 200 } },
    { id: 4, label: "T4", seats: 4, onlineBookable: true, priorityRank: 4, joinGroups: [1, 2], position: { x: 200, y: 200 } },
    { id: 5, label: "T5", seats: 6, onlineBookable: true, priorityRank: 5, joinGroups: [], position: { x: 300, y: 150 } },
    { id: 6, label: "T6", seats: 8, onlineBookable: false, priorityRank: 6, joinGroups: [], position: { x: 400, y: 150 } },
  ];

  const initialJoinGroups = [
    { id: 1, name: "Center Tables", memberTableIds: [2, 3, 4], maxCapacity: 10 },
    { id: 2, name: "Corner Setup", memberTableIds: [2, 3], maxCapacity: 6 }
  ];

  const {
    tables,
    setTables,
    editingTable,
    setEditingTable,
    newTable,
    setNewTable,
    handleAddTable,
    handleUpdateTable,
    handleDeleteTable,
    handleEditTable,
    resetTableForm
  } = useTableManagement(initialTables);

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
  } = useGroupManagement(initialJoinGroups, tables, setTables);

  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);

  const getJoinGroupNames = (groupIds: number[]) => {
    if (!groupIds || groupIds.length === 0) return null;
    return groupIds.map(id => joinGroups.find(g => g.id === id)?.name).filter(Boolean).join(", ");
  };

  const totalSeats = tables.reduce((sum, table) => sum + table.seats, 0);
  const onlineBookableSeats = tables.filter(t => t.onlineBookable).reduce((sum, table) => sum + table.seats, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tables</h1>
          <p className="text-muted-foreground">Manage your restaurant table layout and groupings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddTableDialog(true)}>
            <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
            Add Table
          </Button>
          <Button variant="outline" onClick={() => setShowAddGroupDialog(true)}>
            <Link className="h-4 w-4 mr-2" strokeWidth={2} />
            Create Group
          </Button>
        </div>
      </div>

      <TableStats
        totalTables={tables.length}
        totalSeats={totalSeats}
        onlineBookableSeats={onlineBookableSeats}
      />

      <TableDialog
        isOpen={showAddTableDialog}
        onOpenChange={(open) => {
          setShowAddTableDialog(open);
          if (!open) resetTableForm();
        }}
        editingTable={editingTable}
        newTable={newTable}
        setNewTable={setNewTable}
        setEditingTable={setEditingTable}
        onAddTable={handleAddTable}
        onUpdateTable={handleUpdateTable}
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

      <TableList
        tables={tables}
        setTables={setTables}
        joinGroups={joinGroups}
        onEditTable={handleEditTable}
        onDeleteTable={handleDeleteTable}
        getJoinGroupNames={getJoinGroupNames}
      />

      <JoinGroupsList
        joinGroups={joinGroups}
        tables={tables}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
      />
    </div>
  );
};

export default Tables;
