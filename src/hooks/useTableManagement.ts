
import { useState } from "react";

export const useTableManagement = (initialTables: any[]) => {
  const [tables, setTables] = useState(initialTables);
  const [editingTable, setEditingTable] = useState(null);
  const [newTable, setNewTable] = useState({
    label: "",
    seats: 2,
    onlineBookable: true,
    priorityRank: initialTables.length + 1
  });

  const handleAddTable = () => {
    const table = {
      id: Date.now(),
      ...newTable,
      joinGroups: [],
      position: { x: 100 + tables.length * 50, y: 100 + tables.length * 30 }
    };
    setTables([...tables, table]);
    resetTableForm();
  };

  const handleUpdateTable = () => {
    setTables(tables.map(t => t.id === editingTable.id ? { ...editingTable } : t));
    setEditingTable(null);
  };

  const handleDeleteTable = (tableId: number) => {
    setTables(tables.filter(t => t.id !== tableId));
  };

  const handleEditTable = (table: any) => {
    setEditingTable(table);
  };

  const resetTableForm = () => {
    setNewTable({
      label: "",
      seats: 2,
      onlineBookable: true,
      priorityRank: tables.length + 2
    });
    setEditingTable(null);
  };

  return {
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
  };
};
