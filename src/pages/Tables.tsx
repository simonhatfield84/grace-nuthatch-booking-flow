
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Link, Edit, Trash2 } from "lucide-react";

const Tables = () => {
  const [tables, setTables] = useState([
    { id: 1, label: "T1", seats: 2, onlineBookable: true, priorityRank: 1, joinGroup: null, position: { x: 100, y: 100 } },
    { id: 2, label: "T2", seats: 2, onlineBookable: true, priorityRank: 2, joinGroup: null, position: { x: 200, y: 100 } },
    { id: 3, label: "T3", seats: 4, onlineBookable: true, priorityRank: 3, joinGroup: 1, position: { x: 100, y: 200 } },
    { id: 4, label: "T4", seats: 4, onlineBookable: true, priorityRank: 4, joinGroup: 1, position: { x: 200, y: 200 } },
    { id: 5, label: "T5", seats: 6, onlineBookable: true, priorityRank: 5, joinGroup: null, position: { x: 300, y: 150 } },
    { id: 6, label: "T6", seats: 8, onlineBookable: false, priorityRank: 6, joinGroup: null, position: { x: 400, y: 150 } },
  ]);

  const [joinGroups, setJoinGroups] = useState([
    { id: 1, name: "Center Tables", memberTableIds: [3, 4], maxCapacity: 8 }
  ]);

  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  const [newTable, setNewTable] = useState({
    label: "",
    seats: 2,
    onlineBookable: true,
    priorityRank: tables.length + 1
  });

  const [newGroup, setNewGroup] = useState({
    name: "",
    memberTableIds: [],
    maxCapacity: 0
  });

  const handleAddTable = () => {
    const table = {
      id: Date.now(),
      ...newTable,
      joinGroup: null,
      position: { x: 100 + tables.length * 50, y: 100 + tables.length * 30 }
    };
    setTables([...tables, table]);
    resetTableForm();
    setShowAddTableDialog(false);
  };

  const handleUpdateTable = () => {
    setTables(tables.map(t => t.id === editingTable.id ? { ...editingTable } : t));
    setEditingTable(null);
    setShowAddTableDialog(false);
  };

  const handleDeleteTable = (tableId: number) => {
    setTables(tables.filter(t => t.id !== tableId));
    // Remove from join groups
    setJoinGroups(joinGroups.map(group => ({
      ...group,
      memberTableIds: group.memberTableIds.filter(id => id !== tableId)
    })).filter(group => group.memberTableIds.length > 0));
  };

  const handleEditTable = (table: any) => {
    setEditingTable(table);
    setShowAddTableDialog(true);
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

  const handleAddGroup = () => {
    const group = {
      id: Date.now(),
      ...newGroup,
      maxCapacity: newGroup.memberTableIds.reduce((sum, id) => {
        const table = tables.find(t => t.id === id);
        return sum + (table?.seats || 0);
      }, 0)
    };
    setJoinGroups([...joinGroups, group]);
    
    // Update tables to include join group
    setTables(tables.map(table => 
      newGroup.memberTableIds.includes(table.id) 
        ? { ...table, joinGroup: group.id }
        : table
    ));
    
    resetGroupForm();
    setShowAddGroupDialog(false);
  };

  const handleUpdateGroup = () => {
    const updatedGroup = {
      ...editingGroup,
      maxCapacity: editingGroup.memberTableIds.reduce((sum, id) => {
        const table = tables.find(t => t.id === id);
        return sum + (table?.seats || 0);
      }, 0)
    };
    
    setJoinGroups(joinGroups.map(g => g.id === editingGroup.id ? updatedGroup : g));
    
    // Update tables
    setTables(tables.map(table => {
      if (editingGroup.memberTableIds.includes(table.id)) {
        return { ...table, joinGroup: editingGroup.id };
      } else if (table.joinGroup === editingGroup.id) {
        return { ...table, joinGroup: null };
      }
      return table;
    }));
    
    setEditingGroup(null);
    setShowAddGroupDialog(false);
  };

  const handleDeleteGroup = (groupId: number) => {
    setJoinGroups(joinGroups.filter(g => g.id !== groupId));
    setTables(tables.map(table => 
      table.joinGroup === groupId ? { ...table, joinGroup: null } : table
    ));
  };

  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
    setShowAddGroupDialog(true);
  };

  const resetGroupForm = () => {
    setNewGroup({
      name: "",
      memberTableIds: [],
      maxCapacity: 0
    });
    setEditingGroup(null);
  };

  const getJoinGroupName = (groupId: number | null) => {
    if (!groupId) return null;
    return joinGroups.find(g => g.id === groupId)?.name || `Group ${groupId}`;
  };

  const getAvailableTablesForGroup = () => {
    return tables.filter(table => !table.joinGroup || table.joinGroup === editingGroup?.id);
  };

  const totalSeats = tables.reduce((sum, table) => sum + table.seats, 0);
  const onlineBookableSeats = tables.filter(t => t.onlineBookable).reduce((sum, table) => sum + table.seats, 0);

  const currentFormData = editingTable || newTable;
  const currentGroupData = editingGroup || newGroup;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSeats}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Online Bookable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineBookableSeats}</div>
            <p className="text-xs text-muted-foreground">seats available online</p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Table Dialog */}
      <Dialog open={showAddTableDialog} onOpenChange={(open) => {
        setShowAddTableDialog(open);
        if (!open) resetTableForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Edit Table' : 'Add New Table'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="label">Table Label</Label>
                <Input
                  id="label"
                  value={currentFormData.label}
                  onChange={(e) => editingTable 
                    ? setEditingTable({...editingTable, label: e.target.value})
                    : setNewTable({...newTable, label: e.target.value})
                  }
                  placeholder="e.g., T7"
                />
              </div>
              <div>
                <Label htmlFor="seats">Number of Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  value={currentFormData.seats}
                  onChange={(e) => editingTable
                    ? setEditingTable({...editingTable, seats: parseInt(e.target.value)})
                    : setNewTable({...newTable, seats: parseInt(e.target.value)})
                  }
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority Rank</Label>
                <Input
                  id="priority"
                  type="number"
                  value={currentFormData.priorityRank}
                  onChange={(e) => editingTable
                    ? setEditingTable({...editingTable, priorityRank: parseInt(e.target.value)})
                    : setNewTable({...newTable, priorityRank: parseInt(e.target.value)})
                  }
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="bookable"
                checked={currentFormData.onlineBookable}
                onCheckedChange={(checked) => editingTable
                  ? setEditingTable({...editingTable, onlineBookable: checked})
                  : setNewTable({...newTable, onlineBookable: checked})
                }
              />
              <Label htmlFor="bookable">Available for Online Booking</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={editingTable ? handleUpdateTable : handleAddTable}>
                {editingTable ? 'Update Table' : 'Add Table'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddTableDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Group Dialog */}
      <Dialog open={showAddGroupDialog} onOpenChange={(open) => {
        setShowAddGroupDialog(open);
        if (!open) resetGroupForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Join Group' : 'Create Join Group'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={currentGroupData.name}
                onChange={(e) => editingGroup
                  ? setEditingGroup({...editingGroup, name: e.target.value})
                  : setNewGroup({...newGroup, name: e.target.value})
                }
                placeholder="e.g., Center Tables"
              />
            </div>

            <div>
              <Label>Select Tables</Label>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {getAvailableTablesForGroup().map(table => (
                  <div key={table.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`group-table-${table.id}`}
                      checked={currentGroupData.memberTableIds.includes(table.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const newMemberIds = checked
                          ? [...currentGroupData.memberTableIds, table.id]
                          : currentGroupData.memberTableIds.filter(id => id !== table.id);
                        
                        if (editingGroup) {
                          setEditingGroup({...editingGroup, memberTableIds: newMemberIds});
                        } else {
                          setNewGroup({...newGroup, memberTableIds: newMemberIds});
                        }
                      }}
                    />
                    <Label htmlFor={`group-table-${table.id}`} className="text-sm">
                      {table.label} ({table.seats} seats)
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingGroup ? handleUpdateGroup : handleAddGroup}
                disabled={!currentGroupData.name || currentGroupData.memberTableIds.length < 2}
              >
                {editingGroup ? 'Update Group' : 'Create Group'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddGroupDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables
          .sort((a, b) => a.priorityRank - b.priorityRank)
          .map((table) => (
          <Card key={table.id} className={`${!table.onlineBookable ? 'opacity-75' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{table.label}</CardTitle>
                <div className="flex gap-1">
                  {table.onlineBookable && (
                    <Badge variant="secondary" className="text-xs">Online</Badge>
                  )}
                  {table.joinGroup && (
                    <Badge variant="outline" className="text-xs">
                      <Link className="h-3 w-3 mr-1" strokeWidth={2} />
                      Group
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                <span className="text-sm">{table.seats} seats</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Priority: #{table.priorityRank}
              </div>

              {table.joinGroup && (
                <div className="text-xs">
                  <span className="font-medium">Join Group:</span> {getJoinGroupName(table.joinGroup)}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEditTable(table)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDeleteTable(table.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {joinGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Join Groups</CardTitle>
            <CardDescription>Tables that can be combined for larger parties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {joinGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Tables: {group.memberTableIds.map(id => 
                        tables.find(t => t.id === id)?.label
                      ).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {group.maxCapacity} total seats
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Tables;
