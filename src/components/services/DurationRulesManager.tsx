import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DurationRule, useServiceDurationRules, defaultDurationOptions } from "@/hooks/useServiceDurationRules";

interface DurationRulesManagerProps {
  rules: DurationRule[];
  onChange: (rules: DurationRule[]) => void;
  maxGuests: number;
}

export const DurationRulesManager = ({ rules, onChange, maxGuests }: DurationRulesManagerProps) => {
  const { durationRules, addDurationRule, deleteDurationRule, validateRules } = useServiceDurationRules(rules);
  const [newRule, setNewRule] = useState<DurationRule>({
    minGuests: 1,
    maxGuests: 2,
    durationMinutes: 120
  });

  const handleAddRule = () => {
    if (newRule.minGuests <= newRule.maxGuests && newRule.minGuests >= 1 && newRule.maxGuests <= maxGuests) {
      addDurationRule(newRule);
      onChange([...durationRules, newRule]);
      setNewRule({ minGuests: 1, maxGuests: 2, durationMinutes: 120 });
    }
  };

  const handleDeleteRule = (index: number) => {
    deleteDurationRule(index);
    const updatedRules = durationRules.filter((_, i) => i !== index);
    onChange(updatedRules);
  };

  const validationError = validateRules();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Duration Rules by Party Size</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationError && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {validationError}
          </div>
        )}
        
        <div className="space-y-2">
          {durationRules.map((rule, index) => (
            <div key={rule.id || index} className="flex items-center justify-between bg-muted p-2 rounded">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {rule.minGuests}-{rule.maxGuests} guests
                </Badge>
                <span className="text-sm">→ {rule.durationMinutes} minutes</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRule(index)}
                className="h-6 w-6 p-0 text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-4 gap-2 items-end">
            <div>
              <Label className="text-xs">Min Guests</Label>
              <Select 
                value={newRule.minGuests.toString()} 
                onValueChange={(value) => setNewRule({...newRule, minGuests: parseInt(value)})}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: maxGuests}, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Max Guests</Label>
              <Select 
                value={newRule.maxGuests.toString()} 
                onValueChange={(value) => setNewRule({...newRule, maxGuests: parseInt(value)})}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: maxGuests}, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Duration (min)</Label>
              <Select 
                value={newRule.durationMinutes.toString()} 
                onValueChange={(value) => setNewRule({...newRule, durationMinutes: parseInt(value)})}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultDurationOptions.map(duration => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              size="sm" 
              onClick={handleAddRule}
              disabled={newRule.minGuests > newRule.maxGuests || newRule.minGuests < 1 || newRule.maxGuests > maxGuests}
              className="h-8"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
