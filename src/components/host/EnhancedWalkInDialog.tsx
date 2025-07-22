import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, AlertTriangle, Clock, Settings } from "lucide-react";
import { BookingConflictService, type BookingConflict } from "@/services/bookingConflictService";
import { TableOptimizationService, type TableOptimizationResult } from "@/services/tableOptimizationService";
import { TimeSlotService, type TimeSlotOptimizationResult } from "@/services/timeSlotService";
import { WalkInValidationService, type ValidationResult } from "@/services/walkInValidationService";
import { AdvancedConflictResolution } from "./AdvancedConflictResolution";
import { WalkInValidationPanel } from "./WalkInValidationPanel";
import { format } from "date-fns";

interface EnhancedWalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: any;
  time: string;
  onCreateWalkIn: (walkInData: {
    tableId: number;
    time: string;
    partySize: number;
    guestName?: string;
    duration: number;
    phone?: string;
    email?: string;
    notes?: string;
    guestId?: string;
  }) => void;
  defaultDuration: number;
  selectedDate: Date;
}

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  opt_in_marketing?: boolean;
}

interface ConflictAdjustment {
  wasAutoAdjusted: boolean;
  originalDuration: number;
  adjustedDuration: number;
  conflictInfo: BookingConflict | null;
}

export const EnhancedWalkInDialog = ({
  open,
  onOpenChange,
  table,
  time,
  onCreateWalkIn,
  defaultDuration,
  selectedDate
}: EnhancedWalkInDialogProps) => {
  const [partySize, setPartySize] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(defaultDuration);
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [searching, setSearching] = useState(false);
  const [conflict, setConflict] = useState<BookingConflict | null>(null);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [venueDefaultDuration, setVenueDefaultDuration] = useState(defaultDuration);
  const [conflictAdjustment, setConflictAdjustment] = useState<ConflictAdjustment>({
    wasAutoAdjusted: false,
    originalDuration: defaultDuration,
    adjustedDuration: defaultDuration,
    conflictInfo: null
  });
  const [conflictCheckDebounce, setConflictCheckDebounce] = useState<NodeJS.Timeout | null>(null);

  const [showAdvancedResolution, setShowAdvancedResolution] = useState(false);
  const [tableOptimization, setTableOptimization] = useState<TableOptimizationResult | null>(null);
  const [timeOptimization, setTimeOptimization] = useState<TimeSlotOptimizationResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedAlternativeTable, setSelectedAlternativeTable] = useState<number | null>(null);
  const [selectedAlternativeTime, setSelectedAlternativeTime] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadVenueSettings = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();

        if (profile?.venue_id) {
          const defaultDuration = await BookingConflictService.getDefaultWalkInDuration(profile.venue_id);
          setVenueDefaultDuration(defaultDuration);
          if (open) {
            setDuration(defaultDuration);
            setConflictAdjustment({
              wasAutoAdjusted: false,
              originalDuration: defaultDuration,
              adjustedDuration: defaultDuration,
              conflictInfo: null
            });
          }
        }
      } catch (error) {
        console.error('Error loading venue settings:', error);
      }
    };

    loadVenueSettings();
  }, [user, open]);

  useEffect(() => {
    if (open) {
      // Reset form
      setPartySize(2);
      setGuestName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setDuration(venueDefaultDuration);
      setShowGuestDetails(false);
      setMarketingOptIn(false);
      setSearchResults([]);
      setSelectedGuest(null);
      setConflict(null);
      setConflictAdjustment({
        wasAutoAdjusted: false,
        originalDuration: venueDefaultDuration,
        adjustedDuration: venueDefaultDuration,
        conflictInfo: null
      });
    }
  }, [open, venueDefaultDuration]);

  useEffect(() => {
    if (!table || !time || !user || !open) return;

    if (conflictCheckDebounce) {
      clearTimeout(conflictCheckDebounce);
    }

    const checkConflictsAndOptimize = async () => {
      setIsCheckingConflicts(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();

        if (profile?.venue_id) {
          const conflictInfo = await BookingConflictService.checkWalkInConflicts(
            [table.id],
            format(selectedDate, 'yyyy-MM-dd'),
            time,
            duration,
            profile.venue_id
          );

          setConflict(conflictInfo);

          if (conflictInfo.hasConflict) {
            const [tableOpt, timeOpt] = await Promise.all([
              TableOptimizationService.optimizeTableSelection(
                table.id,
                partySize,
                format(selectedDate, 'yyyy-MM-dd'),
                time,
                duration,
                profile.venue_id
              ),
              TimeSlotService.optimizeTimeSlots(
                table.id,
                time,
                partySize,
                duration,
                format(selectedDate, 'yyyy-MM-dd'),
                profile.venue_id
              )
            ]);

            setTableOptimization(tableOpt);
            setTimeOptimization(timeOpt);

            const hasAlternatives = 
              tableOpt.suggestedTables.length > 0 ||
              timeOpt.earlierSlots.length > 0 ||
              timeOpt.laterSlots.length > 0 ||
              tableOpt.joinGroupOptions.length > 0;

            if (hasAlternatives && conflictInfo.maxAvailableDuration < 30) {
              setShowAdvancedResolution(true);
            }
          }
          
          if (conflictInfo.hasConflict && conflictInfo.maxAvailableDuration > 0) {
            if (!conflictAdjustment.wasAutoAdjusted || duration !== conflictAdjustment.adjustedDuration) {
              const originalDuration = conflictAdjustment.wasAutoAdjusted 
                ? conflictAdjustment.originalDuration 
                : duration;
              
              setDuration(conflictInfo.maxAvailableDuration);
              setConflictAdjustment({
                wasAutoAdjusted: true,
                originalDuration,
                adjustedDuration: conflictInfo.maxAvailableDuration,
                conflictInfo
              });
            }
          } else if (!conflictInfo.hasConflict && !conflictAdjustment.wasAutoAdjusted) {
            setConflictAdjustment({
              wasAutoAdjusted: false,
              originalDuration: duration,
              adjustedDuration: duration,
              conflictInfo: null
            });
          }
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    const debounceTimer = setTimeout(checkConflictsAndOptimize, 300);
    setConflictCheckDebounce(debounceTimer);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [table, time, duration, partySize, user, open, selectedDate]);

  useEffect(() => {
    if (!table || !time || !user || !open) return;

    const validateWalkIn = async () => {
      setIsValidating(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();

        if (profile?.venue_id) {
          const validationResult = await WalkInValidationService.validateWalkIn({
            tableId: selectedAlternativeTable || table.id,
            time: selectedAlternativeTime || time,
            date: format(selectedDate, 'yyyy-MM-dd'),
            partySize,
            duration,
            guestName: guestName.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            venueId: profile.venue_id
          });

          setValidation(validationResult);
        }
      } catch (error) {
        console.error('Error validating walk-in:', error);
      } finally {
        setIsValidating(false);
      }
    };

    const debounceTimer = setTimeout(validateWalkIn, 500);
    return () => clearTimeout(debounceTimer);
  }, [table, time, partySize, duration, guestName, phone, email, selectedAlternativeTable, selectedAlternativeTime, user, open, selectedDate]);

  useEffect(() => {
    const searchGuests = async () => {
      if (!guestName.trim() || guestName.length < 2) {
        setSearchResults([]);
        return;
      }

      if (!user) return;

      setSearching(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();

        if (profile?.venue_id) {
          const { data: guests } = await supabase
            .from('guests')
            .select('*')
            .eq('venue_id', profile.venue_id)
            .or(`name.ilike.%${guestName}%,email.ilike.%${guestName}%,phone.ilike.%${guestName}%`)
            .limit(5);

          setSearchResults(guests || []);
        }
      } catch (error) {
        console.error('Error searching guests:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchGuests, 300);
    return () => clearTimeout(debounceTimer);
  }, [guestName, user]);

  const selectGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setGuestName(guest.name);
    setPhone(guest.phone || "");
    setEmail(guest.email || "");
    setNotes(guest.notes || "");
    setMarketingOptIn(guest.opt_in_marketing || false);
    setSearchResults([]);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    if (conflictAdjustment.wasAutoAdjusted) {
      setConflictAdjustment({
        wasAutoAdjusted: false,
        originalDuration: newDuration,
        adjustedDuration: newDuration,
        conflictInfo: null
      });
    }
  };

  const handleAlternativeTableSelect = (tableId: number, tableName: string) => {
    setSelectedAlternativeTable(tableId);
    setShowAdvancedResolution(false);
    toast({
      title: "Alternative table selected",
      description: `Switched to Table ${tableName}`,
    });
  };

  const handleAlternativeTimeSelect = (newTime: string, tableId: number) => {
    setSelectedAlternativeTime(newTime);
    setSelectedAlternativeTable(tableId);
    setShowAdvancedResolution(false);
    toast({
      title: "Alternative time selected",
      description: `Switched to ${newTime}`,
    });
  };

  const handleJoinGroupSelect = (groupId: number, groupName: string, tableIds: number[]) => {
    setSelectedAlternativeTable(groupId);
    setShowAdvancedResolution(false);
    toast({
      title: "Table group selected",
      description: `Selected ${groupName}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!table) return;

    if (validation && !validation.isValid) {
      toast({
        title: "Validation failed",
        description: "Please fix the validation errors before proceeding.",
        variant: "destructive"
      });
      return;
    }

    const currentConflict = conflict || conflictAdjustment.conflictInfo;

    if (currentConflict?.hasConflict && currentConflict.maxAvailableDuration < 30 && !selectedAlternativeTable && !selectedAlternativeTime) {
      toast({
        title: "Cannot seat walk-in",
        description: "No available time slot found. Please choose a different time or table.",
        variant: "destructive"
      });
      return;
    }

    if (validation?.warnings.length > 0) {
      const proceedableWarnings = validation.warnings.filter(w => w.canProceed);
      if (proceedableWarnings.length > 0) {
        toast({
          title: "Booking created with warnings",
          description: `${proceedableWarnings.length} warning(s) noted but booking can proceed.`,
        });
      }
    }

    onCreateWalkIn({
      tableId: selectedAlternativeTable || table.id,
      time: selectedAlternativeTime || time,
      partySize,
      guestName: guestName.trim() || undefined,
      duration,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      guestId: selectedGuest?.id
    });
    
    onOpenChange(false);
  };

  const calculateEndTime = () => {
    const currentTime = selectedAlternativeTime || time;
    if (!currentTime) return null;
    
    const [hours, minutes] = currentTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + (duration * 60 * 1000));
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!table) return null;

  if (showAdvancedResolution && tableOptimization && timeOptimization) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Resolve Booking Conflict
            </DialogTitle>
          </DialogHeader>
          
          <AdvancedConflictResolution
            tableOptimization={tableOptimization}
            timeOptimization={timeOptimization}
            originalTime={time}
            originalTableLabel={table.label}
            partySize={partySize}
            onSelectTable={handleAlternativeTableSelect}
            onSelectTime={handleAlternativeTimeSelect}
            onSelectJoinGroup={handleJoinGroupSelect}
            onCancel={() => setShowAdvancedResolution(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  const shouldShowConflictWarning = conflictAdjustment.wasAutoAdjusted || conflict?.hasConflict;
  const conflictToDisplay = conflictAdjustment.wasAutoAdjusted ? conflictAdjustment.conflictInfo : conflict;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Seat Walk-In at {selectedAlternativeTable ? `Alternative Table` : `Table ${table.label}`}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                value={selectedAlternativeTime || time}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="endTime">Until</Label>
              <Input
                id="endTime"
                value={calculateEndTime() || ''}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {shouldShowConflictWarning && conflictToDisplay && !selectedAlternativeTable && !selectedAlternativeTime && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {conflictAdjustment.wasAutoAdjusted ? (
                  <>
                    <strong>Duration automatically adjusted!</strong> 
                    {conflictAdjustment.originalDuration !== conflictAdjustment.adjustedDuration && (
                      <> Original {conflictAdjustment.originalDuration} minutes reduced to {conflictAdjustment.adjustedDuration} minutes.</>
                    )}
                    {conflictToDisplay.nextBookingTime && conflictToDisplay.conflictingBooking && (
                      <> Next booking at {conflictToDisplay.nextBookingTime} ({conflictToDisplay.conflictingBooking.guest_name}).</>
                    )}
                  </>
                ) : conflictToDisplay.maxAvailableDuration >= 30 ? (
                  <>
                    <strong>Booking conflict detected!</strong> Next booking at{' '}
                    {conflictToDisplay.nextBookingTime} ({conflictToDisplay.conflictingBooking?.guest_name}).
                    Duration automatically adjusted to {conflictToDisplay.maxAvailableDuration} minutes.
                  </>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <strong>No available time!</strong> Table is fully booked.
                    </div>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAdvancedResolution(true)}
                    >
                      View Alternatives
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isCheckingConflicts && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
              <Clock className="h-4 w-4 animate-spin" />
              Checking availability...
            </div>
          )}

          <WalkInValidationPanel validation={validation} isValidating={isValidating} />

          <div>
            <Label htmlFor="partySize">Number of Guests</Label>
            <Input
              id="partySize"
              type="number"
              min="1"
              max={table.seats}
              value={partySize}
              onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-foreground bg-background border-border"
              placeholder="Enter number of guests"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name</Label>
            <div className="relative">
              <Input
                id="guestName"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setSelectedGuest(null); // Clear selection when typing
                }}
                placeholder="Start typing to search existing guests..."
                className="text-foreground bg-background border-border"
              />
              {searching && (
                <Search className="absolute right-3 top-3 h-4 w-4 animate-spin" />
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div className="border rounded-md bg-background max-h-32 overflow-y-auto">
                {searchResults.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => selectGuest(guest)}
                    className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 text-sm"
                  >
                    <div className="font-medium">{guest.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {guest.email && `${guest.email} • `}
                      {guest.phone}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showGuestDetails"
              checked={showGuestDetails}
              onCheckedChange={(checked) => setShowGuestDetails(checked === true)}
            />
            <Label htmlFor="showGuestDetails" className="text-sm font-normal">
              Add guest details (email, phone, notes)
            </Label>
          </div>

          {showGuestDetails && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="text-foreground bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="text-foreground bg-background border-border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special requests, allergies, etc."
                  className="text-foreground bg-background border-border resize-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketingOptIn"
                  checked={marketingOptIn}
                  onCheckedChange={(checked) => setMarketingOptIn(checked === true)}
                />
                <Label htmlFor="marketingOptIn" className="text-sm font-normal">
                  Subscribe to marketing emails
                </Label>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="30"
              max="360"
              step="15"
              value={duration}
              onChange={(e) => handleDurationChange(Math.max(30, parseInt(e.target.value) || venueDefaultDuration))}
              className="text-foreground bg-background border-border"
              disabled={conflictAdjustment.wasAutoAdjusted}
            />
            {conflictAdjustment.wasAutoAdjusted && (
              <p className="text-xs text-muted-foreground mt-1">
                Duration automatically adjusted due to booking conflict
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={
                (conflict?.hasConflict && conflict.maxAvailableDuration < 30 && !selectedAlternativeTable && !selectedAlternativeTime) ||
                (validation && !validation.isValid)
              }
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Seat Walk-In
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
