
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Users, Link } from "lucide-react";

interface BookingPriorityManagerProps {
  tables: any[];
  joinGroups: any[];
}

export const BookingPriorityManager = ({ tables, joinGroups }: BookingPriorityManagerProps) => {
  const [selectedPartySize, setSelectedPartySize] = useState<string>("2");

  // Get all items (tables + table joins) that can accommodate the selected party size
  const getAvailableItems = (partySize: number) => {
    const availableTables = tables
      .filter(table => table.seats >= partySize)
      .map(table => ({
        ...table,
        type: 'table',
        capacity: table.seats,
        displayName: `${table.label} (${table.seats} seats)`
      }));

    const availableTableJoins = joinGroups
      .filter(group => group.maxCapacity >= partySize)
      .map(group => ({
        ...group,
        type: 'group',
        capacity: group.maxCapacity,
        displayName: `${group.name} (${group.maxCapacity} seats)`
      }));

    return [...availableTables, ...availableTableJoins].sort((a, b) => a.priorityRank - b.priorityRank);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = getAvailableItems(parseInt(selectedPartySize));
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update priority ranks
    items.forEach((item, index) => {
      item.priorityRank = index + 1;
    });

    // Here you would update the database with the new priorities
    console.log('Updated priorities:', items);
  };

  const availableItems = getAvailableItems(parseInt(selectedPartySize));
  const partySizeOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Booking Priority</h3>
          <p className="text-sm text-muted-foreground">
            Set booking priority for tables and table joins by party size
          </p>
        </div>
        <Select value={selectedPartySize} onValueChange={setSelectedPartySize}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select party size" />
          </SelectTrigger>
          <SelectContent>
            {partySizeOptions.map(size => (
              <SelectItem key={size} value={size.toString()}>
                Party size of {size}
              </SelectItem>
            ))}
            <SelectItem value="13">Party size of 13+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Priority Order for Party Size of {selectedPartySize}
          </CardTitle>
          <CardDescription>
            Drag to reorder the booking priority. Higher items will be booked first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tables or table joins can accommodate a party of {selectedPartySize}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="priority-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {availableItems.map((item, index) => (
                      <Draggable key={`${item.type}-${item.id}`} draggableId={`${item.type}-${item.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-3 border rounded-lg bg-background ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            <Badge variant="outline" className="min-w-8">
                              #{index + 1}
                            </Badge>

                            <div className="flex items-center gap-2">
                              {item.type === 'group' && (
                                <Link className="h-4 w-4 text-blue-500" />
                              )}
                              <span className="font-medium">{item.displayName}</span>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                              {item.type === 'table' && (
                                <>
                                  {item.onlineBookable && (
                                    <Badge variant="secondary" className="text-xs">Online</Badge>
                                  )}
                                  {item.joinGroups && item.joinGroups.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      <Link className="h-3 w-3 mr-1" />
                                      {item.joinGroups.length} table joins
                                    </Badge>
                                  )}
                                </>
                              )}
                              {item.type === 'group' && (
                                <Badge variant="outline" className="text-xs">
                                  {item.memberTableIds?.length || 0} tables
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
