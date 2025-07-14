import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTables } from '@/hooks/useTables';
import { useGroupManagement } from '@/hooks/useGroupManagement';
import { Users, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManualTableSelectorProps {
  partySize: number;
  selectedTableIds: number[];
  onTableSelectionChange: (tableIds: number[]) => void;
  bookingDate: string;
  bookingTime: string;
  onSuggestionAccept?: (tableIds: number[]) => void;
  className?: string;
}

export const ManualTableSelector = ({
  partySize,
  selectedTableIds,
  onTableSelectionChange,
  bookingDate,
  bookingTime,
  onSuggestionAccept,
  className
}: ManualTableSelectorProps) => {
  const { tables, updateTable } = useTables();
  const { joinGroups } = useGroupManagement([], tables, updateTable);
  const { toast } = useToast();
  const [conflicts, setConflicts] = useState<number[]>([]);

  // Calculate total capacity of selected tables
  const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));
  const totalCapacity = selectedTables.reduce((sum, table) => sum + table.seats, 0);

  // Find best suggestion based on party size and join groups
  const getBestSuggestion = () => {
    // First, try to find suitable join groups
    const suitableGroups = joinGroups.filter(group => 
      group.min_party_size <= partySize && group.max_party_size >= partySize
    );

    if (suitableGroups.length > 0) {
      // Return the smallest suitable group
      const bestGroup = suitableGroups.reduce((best, current) => 
        current.max_party_size < best.max_party_size ? current : best
      );
      return bestGroup.table_ids;
    }

    // If no join groups work, find individual tables
    const suitableTables = tables.filter(table => 
      table.seats >= partySize && table.online_bookable && table.status === 'active'
    );

    if (suitableTables.length > 0) {
      // Return the smallest suitable table
      const bestTable = suitableTables.reduce((best, current) => 
        current.seats < best.seats ? current : best
      );
      return [bestTable.id];
    }

    return [];
  };

  const bestSuggestion = getBestSuggestion();

  // Check for conflicts (simplified - would need actual booking data)
  useEffect(() => {
    // This would integrate with booking availability service
    // For now, just clear conflicts
    setConflicts([]);
  }, [selectedTableIds, bookingDate, bookingTime]);

  const handleTableToggle = (tableId: number) => {
    const newSelection = selectedTableIds.includes(tableId)
      ? selectedTableIds.filter(id => id !== tableId)
      : [...selectedTableIds, tableId];
    
    onTableSelectionChange(newSelection);
  };

  const handleApplySuggestion = () => {
    onTableSelectionChange(bestSuggestion);
    if (onSuggestionAccept) {
      onSuggestionAccept(bestSuggestion);
    }
    toast({
      title: "Suggestion Applied",
      description: "Best table assignment has been selected.",
    });
  };

  const getTableStatus = (tableId: number) => {
    if (conflicts.includes(tableId)) {
      return { variant: 'destructive' as const, icon: AlertTriangle, text: 'Conflict' };
    }
    if (selectedTableIds.includes(tableId)) {
      return { variant: 'default' as const, icon: CheckCircle, text: 'Selected' };
    }
    return null;
  };

  const isCapacityMet = totalCapacity >= partySize;
  const isOverCapacity = totalCapacity > partySize * 1.5; // 50% over is too much

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Manual Table Selection
          </span>
          <Badge variant={isCapacityMet ? "default" : "secondary"}>
            {totalCapacity} / {partySize} seats
          </Badge>
        </CardTitle>
        
        {/* Best suggestion banner */}
        {bestSuggestion.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Suggested: {bestSuggestion.map(id => 
                    tables.find(t => t.id === id)?.label
                  ).join(', ')}
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={handleApplySuggestion}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-48">
          <div className="grid grid-cols-2 gap-2">
            {tables
              .filter(table => table.online_bookable && table.status === 'active')
              .sort((a, b) => {
                // Extract numbers for proper sorting
                const aNum = parseInt(a.label.replace(/\D/g, '')) || 0;
                const bNum = parseInt(b.label.replace(/\D/g, '')) || 0;
                return aNum - bNum;
              })
              .map((table) => {
                const status = getTableStatus(table.id);
                const isSelected = selectedTableIds.includes(table.id);
                
                return (
                  <div
                    key={table.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTableToggle(table.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => {}}
                        />
                        <Label className="font-medium cursor-pointer">
                          {table.label}
                        </Label>
                      </div>
                      {status && (
                        <Badge variant={status.variant} className="text-xs">
                          <status.icon className="h-3 w-3 mr-1" />
                          {status.text}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                      <Users className="h-3 w-3" />
                      <span>{table.seats} seats</span>
                      {table.join_groups && table.join_groups.length > 0 && (
                        <Badge variant="outline" className="text-xs ml-2">
                          Can join
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>

        {/* Selection summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>
              <strong>Selected:</strong> {selectedTables.map(t => t.label).join(', ') || 'None'}
            </span>
            <span className={`font-medium ${
              isCapacityMet 
                ? isOverCapacity 
                  ? 'text-orange-600' 
                  : 'text-green-600'
                : 'text-red-600'
            }`}>
              {totalCapacity} seats for {partySize} guests
              {isOverCapacity && ' (over capacity)'}
              {!isCapacityMet && ' (insufficient)'}
            </span>
          </div>
          
          {conflicts.length > 0 && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {conflicts.length} table(s) have booking conflicts
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};