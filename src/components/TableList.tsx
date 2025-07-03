
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Link, GripVertical, Users } from "lucide-react";

interface TableListProps {
  tables: any[];
  setTables: (tables: any[]) => void;
  joinGroups: any[];
  onEditTable: (table: any) => void;
  onDeleteTable: (tableId: number) => void;
  getJoinGroupNames: (groupIds: number[]) => string | null;
}

export const TableList = ({ 
  tables, 
  setTables, 
  joinGroups, 
  onEditTable, 
  onDeleteTable, 
  getJoinGroupNames 
}: TableListProps) => {
  const [seatFilter, setSeatFilter] = useState<string>("all");

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(tables);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update priority ranks based on new order
    const updatedTables = items.map((table, index) => ({
      ...table,
      priorityRank: index + 1
    }));

    setTables(updatedTables);
  };

  const filteredTables = tables
    .sort((a, b) => a.priorityRank - b.priorityRank)
    .filter(table => {
      if (seatFilter === "all") return true;
      const minSeats = parseInt(seatFilter);
      return table.seats >= minSeats;
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Table List</h3>
          <Select value={seatFilter} onValueChange={setSeatFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by seats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              <SelectItem value="2">2+ Seats</SelectItem>
              <SelectItem value="4">4+ Seats</SelectItem>
              <SelectItem value="6">6+ Seats</SelectItem>
              <SelectItem value="8">8+ Seats</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tables">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Groups</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTables.map((table, index) => (
                    <Draggable key={table.id} draggableId={table.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? "bg-muted" : ""}
                        >
                          <TableCell {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">#{table.priorityRank}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{table.label}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {table.seats}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {table.onlineBookable && (
                                <Badge variant="secondary" className="text-xs">Online</Badge>
                              )}
                              {table.joinGroups && table.joinGroups.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Link className="h-3 w-3 mr-1" />
                                  Groups ({table.joinGroups.length})
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {table.joinGroups && table.joinGroups.length > 0 ? (
                                table.joinGroups.map((groupId: number) => {
                                  const group = joinGroups.find(g => g.id === groupId);
                                  return group ? (
                                    <Badge key={groupId} variant="outline" className="text-xs">
                                      {group.name}
                                    </Badge>
                                  ) : null;
                                })
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => onEditTable(table)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onDeleteTable(table.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </TableBody>
              </Table>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
