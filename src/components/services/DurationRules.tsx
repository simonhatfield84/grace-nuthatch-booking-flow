
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

export interface DurationRule {
  id?: string;
  minGuests: number;
  maxGuests: number;
  durationMinutes: number;
}

interface DurationRulesProps {
  rules: DurationRule[];
  onChange: (rules: DurationRule[]) => void;
}

const defaultDurationOptions = [30, 45, 60, 75, 90, 105, 120, 135, 150, 180, 210, 240, 300, 360];

export const DurationRules: React.FC<DurationRulesProps> = ({ rules, onChange }) => {
  const addRule = () => {
    const newRule: DurationRule = {
      id: `temp-${Date.now()}`,
      minGuests: 1,
      maxGuests: 4,
      durationMinutes: 120
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (index: number, field: keyof DurationRule, value: number) => {
    const updatedRules = rules.map((rule, i) => 
      i === index ? { ...rule, [field]: value } : rule
    );
    onChange(updatedRules);
  };

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    onChange(updatedRules);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Set different booking durations based on party size
        </p>
        <Button type="button" onClick={addRule} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {rules.map((rule, index) => (
        <div key={rule.id || index} className="flex items-center gap-2 p-3 border rounded-lg">
          <div className="grid grid-cols-4 gap-2 flex-1">
            <div>
              <Label className="text-xs">Min Guests</Label>
              <Input
                type="number"
                min="1"
                value={rule.minGuests}
                onChange={(e) => updateRule(index, 'minGuests', parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label className="text-xs">Max Guests</Label>
              <Input
                type="number"
                min="1"
                value={rule.maxGuests}
                onChange={(e) => updateRule(index, 'maxGuests', parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label className="text-xs">Duration (mins)</Label>
              <Select
                value={rule.durationMinutes.toString()}
                onValueChange={(value) => updateRule(index, 'durationMinutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultDurationOptions.map((duration) => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration} mins
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => removeRule(index)}
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {rules.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No duration rules set. Default duration will be used for all party sizes.
        </p>
      )}
    </div>
  );
};
