
import { useState } from "react";

export const useGroupManagement = (initialGroups: any[], tables: any[], setTables: (tables: any[]) => void) => {
  const [joinGroups, setJoinGroups] = useState(initialGroups);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: "",
    memberTableIds: [],
    maxCapacity: 0
  });

  const handleAddGroup = () => {
    const group = {
      id: Date.now(),
      ...newGroup,
      maxCapacity: parseInt(newGroup.maxCapacity.toString()) || newGroup.memberTableIds.reduce((sum: number, id: number) => {
        const table = tables.find(t => t.id === id);
        return sum + (table?.seats || 0);
      }, 0)
    };
    setJoinGroups([...joinGroups, group]);
    
    // Update tables to include this join group in their joinGroups array
    setTables(tables.map(table => 
      newGroup.memberTableIds.includes(table.id) 
        ? { ...table, joinGroups: [...table.joinGroups, group.id] }
        : table
    ));
    
    resetGroupForm();
  };

  const handleUpdateGroup = () => {
    const updatedGroup = {
      ...editingGroup,
      maxCapacity: parseInt(editingGroup.maxCapacity.toString()) || editingGroup.memberTableIds.reduce((sum: number, id: number) => {
        const table = tables.find(t => t.id === id);
        return sum + (table?.seats || 0);
      }, 0)
    };
    
    setJoinGroups(joinGroups.map(g => g.id === editingGroup.id ? updatedGroup : g));
    
    // Update tables to reflect new group membership
    setTables(tables.map(table => {
      const wasInGroup = table.joinGroups.includes(editingGroup.id);
      const shouldBeInGroup = editingGroup.memberTableIds.includes(table.id);
      
      if (!wasInGroup && shouldBeInGroup) {
        return { ...table, joinGroups: [...table.joinGroups, editingGroup.id] };
      } else if (wasInGroup && !shouldBeInGroup) {
        return { ...table, joinGroups: table.joinGroups.filter((gId: number) => gId !== editingGroup.id) };
      }
      return table;
    }));
    
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupId: number) => {
    setJoinGroups(joinGroups.filter(g => g.id !== groupId));
    setTables(tables.map(table => ({
      ...table,
      joinGroups: table.joinGroups.filter((gId: number) => gId !== groupId)
    })));
  };

  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
  };

  const resetGroupForm = () => {
    setNewGroup({
      name: "",
      memberTableIds: [],
      maxCapacity: 0
    });
    setEditingGroup(null);
  };

  return {
    joinGroups,
    setJoinGroups,
    editingGroup,
    setEditingGroup,
    newGroup,
    setNewGroup,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleEditGroup,
    resetGroupForm
  };
};
