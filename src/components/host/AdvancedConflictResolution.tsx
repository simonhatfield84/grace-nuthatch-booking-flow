
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, MapPin, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { TableSuggestion, TableOptimizationResult } from "@/services/tableOptimizationService";
import { TimeSlotSuggestion, TimeSlotOptimizationResult } from "@/services/timeSlotService";

interface AdvancedConflictResolutionProps {
  tableOptimization: TableOptimizationResult;
  timeOptimization: TimeSlotOptimizationResult;
  originalTime: string;
  originalTableLabel: string;
  partySize: number;
  onSelectTable: (tableId: number, tableName: string) => void;
  onSelectTime: (time: string, tableId: number) => void;
  onSelectJoinGroup: (groupId: number, groupName: string, tableIds: number[]) => void;
  onCancel: () => void;
}

export const AdvancedConflictResolution = ({
  tableOptimization,
  timeOptimization,
  originalTime,
  originalTableLabel,
  partySize,
  onSelectTable,
  onSelectTime,
  onSelectJoinGroup,
  onCancel
}: AdvancedConflictResolutionProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const hasAlternatives = 
    tableOptimization.suggestedTables.length > 0 ||
    timeOptimization.earlierSlots.length > 0 ||
    timeOptimization.laterSlots.length > 0 ||
    tableOptimization.joinGroupOptions.length > 0;

  if (!hasAlternatives) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            No Available Options
          </CardTitle>
          <CardDescription>
            Unfortunately, we couldn't find any suitable alternatives for your party of {partySize} at {originalTime}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Consider:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Choosing a different time slot</li>
              <li>Splitting the party across multiple tables</li>
              <li>Adding to the waitlist if available</li>
              <li>Making a reservation for later</li>
            </ul>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Table {originalTableLabel} Unavailable
          </CardTitle>
          <CardDescription className="text-amber-700">
            Your requested table at {originalTime} has a conflict. Here are the best alternatives:
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Alternative Tables */}
      {tableOptimization.suggestedTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alternative Tables</CardTitle>
            <CardDescription>
              Available tables that can accommodate your party of {partySize} at {originalTime}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tableOptimization.suggestedTables.map((table) => (
              <div
                key={table.tableId}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedOption === `table-${table.tableId}`
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedOption(`table-${table.tableId}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Table {table.tableLabel}</div>
                      <div className="text-sm text-muted-foreground">
                        {table.sectionName && `${table.sectionName} • `}
                        {table.seats} seats • {table.reason}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {table.seats}
                    </Badge>
                    {selectedOption === `table-${table.tableId}` && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTable(table.tableId, table.tableLabel);
                        }}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alternative Times */}
      {(timeOptimization.earlierSlots.length > 0 || timeOptimization.laterSlots.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alternative Times</CardTitle>
            <CardDescription>
              Available time slots for Table {originalTableLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeOptimization.earlierSlots.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Earlier Today</h4>
                <div className="space-y-2">
                  {timeOptimization.earlierSlots.map((slot) => (
                    <div
                      key={slot.time}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedOption === `time-${slot.time}`
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedOption(`time-${slot.time}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{slot.time}</div>
                            <div className="text-sm text-muted-foreground">{slot.reason}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {slot.availableDuration} min
                          </Badge>
                          {selectedOption === `time-${slot.time}` && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTime(slot.time, slot.tableId);
                              }}
                            >
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {timeOptimization.laterSlots.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Later Today</h4>
                <div className="space-y-2">
                  {timeOptimization.laterSlots.map((slot) => (
                    <div
                      key={slot.time}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedOption === `time-${slot.time}`
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedOption(`time-${slot.time}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{slot.time}</div>
                            <div className="text-sm text-muted-foreground">{slot.reason}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {slot.availableDuration} min
                          </Badge>
                          {selectedOption === `time-${slot.time}` && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTime(slot.time, slot.tableId);
                              }}
                            >
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Join Group Options */}
      {tableOptimization.joinGroupOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Table Groups</CardTitle>
            <CardDescription>
              Multiple connected tables for larger parties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tableOptimization.joinGroupOptions.map((group) => (
              <div
                key={group.tableId}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedOption === `group-${group.tableId}`
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedOption(`group-${group.tableId}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{group.tableLabel}</div>
                      <div className="text-sm text-muted-foreground">{group.reason}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {group.seats}
                    </Badge>
                    {selectedOption === `group-${group.tableId}` && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectJoinGroup(group.tableId, group.tableLabel, group.joinGroupTables || []);
                        }}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Flexible Duration Options */}
      {timeOptimization.flexibleDurationOptions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">Flexible Duration</CardTitle>
            <CardDescription className="text-blue-700">
              Consider shorter durations for more availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {timeOptimization.flexibleDurationOptions.map((option) => (
                <Badge key={option.duration} variant="outline" className="border-blue-300">
                  {option.duration} minutes available at {option.availableAt}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
