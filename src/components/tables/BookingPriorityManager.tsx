
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookingPriorities } from "@/hooks/useBookingPriorities";
import { useTables } from "@/hooks/useTables";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GripVertical, Users, Table, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingPriorityManagerProps {
  tables?: any[];
  joinGroups?: any[];
}

export const BookingPriorityManager = ({ tables: propTables, joinGroups: propJoinGroups }: BookingPriorityManagerProps = {}) => {
  const { priorities, updatePriorities, addPriority, isLoading } = useBookingPriorities();
  const { tables: hookTables } = useTables();
  const { toast } = useToast();
  
  // Fetch join groups
  const { data: hookJoinGroups = [] } = useQuery({
    queryKey: ['join-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('join_groups')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Use props if provided, otherwise use hooks
  const tables = propTables || hookTables;
  const joinGroups = propJoinGroups || hookJoinGroups;
  const [selectedPartySize, setSelectedPartySize] = useState<number>(2);
  const [localPriorities, setLocalPriorities] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const filtered = priorities.filter(p => p.party_size === selectedPartySize);
    const sorted = [...filtered].sort((a, b) => a.priority_rank - b.priority_rank);
    setLocalPriorities(sorted);
  }, [priorities, selectedPartySize]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Reorder local priorities
    const reorderedPriorities = Array.from(localPriorities);
    const [reorderedItem] = reorderedPriorities.splice(sourceIndex, 1);
    reorderedPriorities.splice(destinationIndex, 0, reorderedItem);

    // Update priority ranks
    const updatedPriorities = reorderedPriorities.map((priority, index) => ({
      ...priority,
      priority_rank: index + 1,
    }));

    setLocalPriorities(updatedPriorities);

    try {
      await updatePriorities(updatedPriorities);
    } catch (error) {
      console.error('Failed to update priorities:', error);
      // Revert on error
      setLocalPriorities(localPriorities);
    }
  };

  const generateMissingPriorities = async () => {
    setIsGenerating(true);
    try {
      const allItems = [
        ...tables.map(t => ({ type: 'table', id: t.id, capacity: t.seats })),
        ...joinGroups.map(g => ({ type: 'join_group', id: g.id, capacity: g.max_party_size }))
      ];

      for (const item of allItems) {
        // Check if priority already exists for this party size and item
        const exists = priorities.some(p => 
          p.party_size === selectedPartySize && 
          p.item_type === item.type && 
          p.item_id === item.id
        );

        if (!exists) {
          await addPriority({
            party_size: selectedPartySize,
            item_type: item.type,
            item_id: item.id
          });
        }
      }

      toast({
        title: "Priorities generated",
        description: `Missing booking priorities have been created for ${selectedPartySize} guests.`
      });
    } catch (error) {
      console.error('Failed to generate priorities:', error);
      toast({
        title: "Error",
        description: "Failed to generate missing priorities.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getItemLabel = (priority: any) => {
    if (priority.item_type === 'table') {
      const table = tables.find(t => t.id === priority.item_id);
      return table ? `Table ${table.label}` : `Table ${priority.item_id}`;
    } else if (priority.item_type === 'join_group') {
      const group = joinGroups.find(g => g.id === priority.item_id);
      return group ? group.name : `Group ${priority.item_id}`;
    }
    return `Unknown ${priority.item_id}`;
  };

  const getItemCapacity = (priority: any) => {
    if (priority.item_type === 'table') {
      const table = tables.find(t => t.id === priority.item_id);
      return table ? table.seats : 0;
    } else if (priority.item_type === 'join_group') {
      const group = joinGroups.find(g => g.id === priority.item_id);
      return group ? group.max_party_size : 0;
    }
    return 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading booking priorities...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Booking Priority Order
        </CardTitle>
        <CardDescription>
          Drag and drop to set the priority order for table assignments. Higher items will be assigned first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Party Size:</label>
            <Select
              value={selectedPartySize.toString()}
              onValueChange={(value) => setSelectedPartySize(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} {size === 1 ? 'guest' : 'guests'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {localPriorities.length === 0 && (
            <Button 
              onClick={generateMissingPriorities}
              disabled={isGenerating}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate Priorities
            </Button>
          )}
        </div>

        {localPriorities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Table className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No booking priorities set for {selectedPartySize} guests</p>
            <p className="text-sm">Click "Generate Priorities" to create them automatically</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="priorities">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 min-h-24 p-2 rounded-lg transition-colors ${
                    snapshot.isDraggingOver ? 'bg-muted/50' : ''
                  }`}
                >
                  {localPriorities.map((priority, index) => (
                    <Draggable
                      key={`${priority.item_type}-${priority.item_id}`}
                      draggableId={`${priority.item_type}-${priority.item_id}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-3 bg-background border rounded-lg transition-all ${
                            snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-sm'
                          }`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">
                                #{index + 1}
                              </span>
                              <span>{getItemLabel(priority)}</span>
                              <Badge variant="secondary" className="text-xs">
                                {getItemCapacity(priority)} seats
                              </Badge>
                              <Badge 
                                variant={priority.item_type === 'table' ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {priority.item_type === 'table' ? 'Table' : 'Group'}
                              </Badge>
                            </div>
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

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <p><strong>How it works:</strong></p>
          <p>• Higher items in the list get priority for bookings</p>
          <p>• Tables with exact capacity matches are preferred</p>
          <p>• Join groups are used when individual tables can't accommodate the party</p>
          <p>• Use "Generate Priorities" to automatically create missing entries</p>
        </div>
      </CardContent>
    </Card>
  );
};
