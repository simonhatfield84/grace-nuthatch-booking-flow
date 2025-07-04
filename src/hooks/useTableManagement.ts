
import { useState } from "react";

export const useTableManagement = (initialTables: any[]) => {
  const [tables, setTables] = useState(initialTables);
  const [editingTable, setEditingTable] = useState(null);
  const [newTable, setNewTable] = useState({
    label: "",
    seats: 2,
    onlineBookable: true,
    priorityRank: initialTables.length + 1,
    sectionId: null // This will be required now
  });

  const validateTable = (table: any) => {
    if (!table.sectionId) {
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

  const handleAddTable = () => {
    try {
      validateTable(newTable);
      const table = {
        id: Date.now(),
        ...newTable,
        joinGroups: [],
        position: { x: 100 + tables.length * 50, y: 100 + tables.length * 30 }
      };
      setTables([...tables, table]);
      resetTableForm();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateTable = () => {
    if (!editingTable) return;
    try {
      validateTable(editingTable);
      setTables(tables.map(t => t.id === editingTable.id ? { ...editingTable } : t));
      setEditingTable(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteTable = (tableId: number) => {
    setTables(tables.filter(t => t.id !== tableId));
  };

  const handleEditTable = (table: any) => {
    setEditingTable({ ...table });
  };

  const resetTableForm = () => {
    setNewTable({
      label: "",
      seats: 2,
      onlineBookable: true,
      priorityRank: tables.length + 2,
      sectionId: null
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
    resetTableForm,
    validateTable
  };
};
