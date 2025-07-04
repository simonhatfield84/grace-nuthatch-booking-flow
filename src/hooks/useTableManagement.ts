
import { useState } from "react";
import { useTables, Table } from "./useTables";

export const useTableManagement = () => {
  const { tables, createTable, updateTable, deleteTable } = useTables();
  const [editingTable, setEditingTable] = useState<Table | null>(null);
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

  const validateTable = (table: any) => {
    if (!table.section_id) {
      throw new Error("Section is required for all tables");
    }
    if (!table.label.trim()) {
      throw new Error("Table label is required");
    }
    if (table.seats < 1) {
      throw new Error("Table must have at least 1 seat");
    }
    return true;
  };

  const handleAddTable = async () => {
    try {
      validateTable(newTable);
      const maxPriority = Math.max(...tables.map(t => t.priority_rank), 0);
      await createTable({
        ...newTable,
        priority_rank: maxPriority + 1
      });
      resetTableForm();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateTable = async () => {
    if (!editingTable) return;
    try {
      validateTable(editingTable);
      await updateTable({ id: editingTable.id, updates: editingTable });
      setEditingTable(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    await deleteTable(tableId);
  };

  const handleEditTable = (table: Table) => {
    setEditingTable({ ...table });
  };

  const resetTableForm = () => {
    const maxPriority = Math.max(...tables.map(t => t.priority_rank), 0);
    setNewTable({
      label: "",
      seats: 2,
      online_bookable: true,
      priority_rank: maxPriority + 1,
      section_id: null,
      position_x: 100,
      position_y: 100,
      join_groups: []
    });
    setEditingTable(null);
  };

  return {
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
    validateTable,
    updateTable // Expose this for use in other hooks
  };
};
