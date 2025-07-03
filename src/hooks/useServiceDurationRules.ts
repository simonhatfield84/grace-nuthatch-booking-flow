
import { useState } from "react";

export type DurationRule = {
  id?: string;
  minGuests: number;
  maxGuests: number;
  durationMinutes: number;
};

export const defaultDurationOptions = [30, 45, 60, 75, 90, 105, 120, 135, 150, 180, 210, 240, 300, 360];

export const useServiceDurationRules = (initialRules: DurationRule[] = []) => {
  const [durationRules, setDurationRules] = useState<DurationRule[]>(initialRules);

  const addDurationRule = (rule: DurationRule) => {
    const newRule = {
      ...rule,
      id: rule.id || `temp-${Date.now()}`
    };
    setDurationRules(prev => [...prev, newRule]);
  };

  const updateDurationRule = (index: number, rule: DurationRule) => {
    setDurationRules(prev => prev.map((r, i) => i === index ? rule : r));
  };

  const deleteDurationRule = (index: number) => {
    setDurationRules(prev => prev.filter((_, i) => i !== index));
  };

  const resetDurationRules = (rules: DurationRule[] = []) => {
    setDurationRules(rules);
  };

  const validateRules = () => {
    // Check for overlapping guest ranges
    for (let i = 0; i < durationRules.length; i++) {
      for (let j = i + 1; j < durationRules.length; j++) {
        const rule1 = durationRules[i];
        const rule2 = durationRules[j];
        
        if (
          (rule1.minGuests <= rule2.maxGuests && rule1.maxGuests >= rule2.minGuests) ||
          (rule2.minGuests <= rule1.maxGuests && rule2.maxGuests >= rule1.minGuests)
        ) {
          return `Guest ranges overlap: ${rule1.minGuests}-${rule1.maxGuests} and ${rule2.minGuests}-${rule2.maxGuests}`;
        }
      }
    }
    return null;
  };

  return {
    durationRules,
    addDurationRule,
    updateDurationRule,
    deleteDurationRule,
    resetDurationRules,
    validateRules
  };
};
