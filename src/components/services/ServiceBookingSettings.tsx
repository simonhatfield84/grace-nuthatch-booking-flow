
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TabsContent } from "@/components/ui/tabs";
import { DurationRules } from "@/components/services/DurationRules";

interface ServiceBookingSettingsProps {
  minGuests: number;
  maxGuests: number;
  leadTimeHours: number;
  cancellationWindowHours: number;
  requiresDeposit: boolean;
  depositPerGuest: number;
  onlineBookable: boolean;
  durationRules: any[];
  onMinGuestsChange: (value: number) => void;
  onMaxGuestsChange: (value: number) => void;
  onLeadTimeHoursChange: (value: number) => void;
  onCancellationWindowHoursChange: (value: number) => void;
  onRequiresDepositChange: (value: boolean) => void;
  onDepositPerGuestChange: (value: number) => void;
  onOnlineBookableChange: (value: boolean) => void;
  onDurationRulesChange: (rules: any[]) => void;
}

export const ServiceBookingSettings = ({
  minGuests,
  maxGuests,
  leadTimeHours,
  cancellationWindowHours,
  requiresDeposit,
  depositPerGuest,
  onlineBookable,
  durationRules,
  onMinGuestsChange,
  onMaxGuestsChange,
  onLeadTimeHoursChange,
  onCancellationWindowHoursChange,
  onRequiresDepositChange,
  onDepositPerGuestChange,
  onOnlineBookableChange,
  onDurationRulesChange
}: ServiceBookingSettingsProps) => {
  return (
    <TabsContent value="booking" className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minGuests">Minimum Guests</Label>
          <Input
            type="number"
            id="minGuests"
            value={minGuests}
            onChange={(e) => onMinGuestsChange(parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxGuests">Maximum Guests</Label>
          <Input
            type="number"
            id="maxGuests"
            value={maxGuests}
            onChange={(e) => onMaxGuestsChange(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leadTimeHours">Lead Time (Hours)</Label>
          <Input
            type="number"
            id="leadTimeHours"
            value={leadTimeHours}
            onChange={(e) => onLeadTimeHoursChange(parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cancellationWindowHours">Cancellation Window (Hours)</Label>
          <Input
            type="number"
            id="cancellationWindowHours"
            value={cancellationWindowHours}
            onChange={(e) => onCancellationWindowHoursChange(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="requiresDeposit"
          checked={requiresDeposit}
          onCheckedChange={(checked) => onRequiresDepositChange(!!checked)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="requiresDeposit">Requires Deposit</Label>
          <p className="text-sm text-muted-foreground">
            Require a deposit to secure the booking
          </p>
        </div>
      </div>

      {requiresDeposit && (
        <div className="space-y-2">
          <Label htmlFor="depositPerGuest">Deposit Per Guest</Label>
          <Input
            type="number"
            id="depositPerGuest"
            value={depositPerGuest}
            onChange={(e) => onDepositPerGuestChange(parseInt(e.target.value))}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="onlineBookable"
          checked={onlineBookable}
          onCheckedChange={(checked) => onOnlineBookableChange(!!checked)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="onlineBookable">Online Bookable</Label>
          <p className="text-sm text-muted-foreground">
            Allow customers to book this service online
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Duration Rules</Label>
        <DurationRules
          rules={durationRules}
          onChange={onDurationRulesChange}
        />
      </div>
    </TabsContent>
  );
};
