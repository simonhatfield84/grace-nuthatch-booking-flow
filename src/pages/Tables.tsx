
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Link } from "lucide-react";

const Tables = () => {
  const [tables, setTables] = useState([
    { id: 1, label: "T1", seats: 2, onlineBookable: true, priorityRank: 1, joinGroup: null },
    { id: 2, label: "T2", seats: 2, onlineBookable: true, priorityRank: 2, joinGroup: null },
    { id: 3, label: "T3", seats: 4, onlineBookable: true, priorityRank: 3, joinGroup: 1 },
    { id: 4, label: "T4", seats: 4, onlineBookable: true, priorityRank: 4, joinGroup: 1 },
    { id: 5, label: "T5", seats: 6, onlineBookable: true, priorityRank: 5, joinGroup: null },
    { id: 6, label: "T6", seats: 8, onlineBookable: false, priorityRank: 6, joinGroup: null },
  ]);

  const [joinGroups, setJoinGroups] = useState([
    { id: 1, name: "Center Tables", memberTableIds: [3, 4] }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTable, setNewTable] = useState({
    label: "",
    seats: 2,
    onlineBookable: true,
    priorityRank: tables.length + 1
  });

  const handleAddTable = () => {
    const table = {
      id: Date.now(),
      ...newTable,
      joinGroup: null
    };
    setTables([...tables, table]);
    setNewTable({
      label: "",
      seats: 2,
      onlineBookable: true,
      priorityRank: tables.length + 2
    });
    setShowAddForm(false);
  };

  const getJoinGroupName = (groupId: number | null) => {
    if (!groupId) return null;
    return joinGroups.find(g => g.id === groupId)?.name || `Group ${groupId}`;
  };

  const totalSeats = tables.reduce((sum, table) => sum + table.seats, 0);
  const onlineBookableSeats = tables.filter(t => t.onlineBookable).reduce((sum, table) => sum + table.seats, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tables</h1>
          <p className="text-muted-foreground">Manage your restaurant table layout</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} />
          Add Table
        </Button>
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

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Table</CardTitle>
            <CardDescription>Create a new table for your restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="label">Table Label</Label>
                <Input
                  id="label"
                  value={newTable.label}
                  onChange={(e) => setNewTable({...newTable, label: e.target.value})}
                  placeholder="e.g., T7"
                />
              </div>
              <div>
                <Label htmlFor="seats">Number of Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  value={newTable.seats}
                  onChange={(e) => setNewTable({...newTable, seats: parseInt(e.target.value)})}
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority Rank</Label>
                <Input
                  id="priority"
                  type="number"
                  value={newTable.priorityRank}
                  onChange={(e) => setNewTable({...newTable, priorityRank: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="bookable"
                checked={newTable.onlineBookable}
                onCheckedChange={(checked) => setNewTable({...newTable, onlineBookable: checked})}
              />
              <Label htmlFor="bookable">Available for Online Booking</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddTable}>Add Table</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

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

              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Edit Table
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
                  <Badge variant="outline">
                    {group.memberTableIds.reduce((sum, id) => {
                      const table = tables.find(t => t.id === id);
                      return sum + (table?.seats || 0);
                    }, 0)} total seats
                  </Badge>
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
