import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface BlackoutPeriod {
  id?: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

interface BookingWindow {
  id?: string;
  service_id: string;
  days: string[];
  start_time: string;
  end_time: string;
  max_bookings_per_slot: number;
  start_date?: Date | null;
  end_date?: Date | null;
  blackout_periods: BlackoutPeriod[];
}

interface BookingWindowManagerProps {
  serviceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dayOptions = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" }
];

// Updated time slots to 15-minute increments instead of 30-minute
const timeSlots = [
  "06:00", "06:15", "06:30", "06:45", "07:00", "07:15", "07:30", "07:45",
  "08:00", "08:15", "08:30", "08:45", "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45", "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45", "17:00", "17:15", "17:30", "17:45",
  "18:00", "18:15", "18:30", "18:45", "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30", "21:45",
  "22:00", "22:15", "22:30", "22:45", "23:00", "23:15", "23:30", "23:45"
];

export function BookingWindowManager({ serviceId, open, onOpenChange }: BookingWindowManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingWindow, setEditingWindow] = useState<BookingWindow | null>(null);
  const [showWindowDialog, setShowWindowDialog] = useState(false);
  const [startToday, setStartToday] = useState(false);
  const [openEnded, setOpenEnded] = useState(true);
  const [newBlackoutPeriod, setNewBlackoutPeriod] = useState<Partial<BlackoutPeriod>>({});

  // Add debugging for serviceId
  useEffect(() => {
    console.log('BookingWindowManager serviceId:', serviceId);
    console.log('BookingWindowManager open:', open);
  }, [serviceId, open]);

  // Validation: Don't render if serviceId is null
  if (!serviceId) {
    console.warn('BookingWindowManager: serviceId is null, not rendering dialog');
    return null;
  }

  // Fetch booking windows for this service
  const { data: windows = [] } = useQuery({
    queryKey: ['booking-windows', serviceId],
    queryFn: async () => {
      console.log('Fetching booking windows for service:', serviceId);
      const { data, error } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at');
      
      if (error) {
        console.error('Error fetching booking windows:', error);
        throw error;
      }
      
      console.log('Fetched booking windows:', data);
      return data.map(window => ({
        ...window,
        start_date: window.start_date ? new Date(window.start_date) : null,
        end_date: window.end_date ? new Date(window.end_date) : null,
        blackout_periods: Array.isArray(window.blackout_periods) ? window.blackout_periods.map((bp: any) => ({
          ...bp,
          startDate: new Date(bp.startDate),
          endDate: new Date(bp.endDate)
        })) : []
      }));
    },
    enabled: open && !!serviceId
  });

  // Create window mutation
  const createWindowMutation = useMutation({
    mutationFn: async (window: Omit<BookingWindow, 'id'>) => {
      console.log('Creating booking window with data:', window);
      
      // Validate serviceId before submission
      if (!window.service_id) {
        throw new Error('Service ID is required');
      }

      const { data, error } = await supabase
        .from('booking_windows')
        .insert({
          service_id: window.service_id,
          days: window.days,
          start_time: window.start_time,
          end_time: window.end_time,
          max_bookings_per_slot: window.max_bookings_per_slot,
          start_date: window.start_date?.toISOString().split('T')[0] || null,
          end_date: window.end_date?.toISOString().split('T')[0] || null,
          blackout_periods: window.blackout_periods.map(bp => ({
            ...bp,
            startDate: bp.startDate.toISOString().split('T')[0],
            endDate: bp.endDate.toISOString().split('T')[0]
          }))
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating booking window:', error);
        throw error;
      }
      
      console.log('Successfully created booking window:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-windows', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['all-booking-windows'] });
      setShowWindowDialog(false);
      resetWindowForm();
      toast({
        title: "Success",
        description: "Booking window created successfully"
      });
    },
    onError: (error: any) => {
      console.error('Error creating booking window:', error);
      toast({
        title: "Error",
        description: `Failed to create booking window: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update window mutation
  const updateWindowMutation = useMutation({
    mutationFn: async (window: BookingWindow) => {
      console.log('Updating booking window with data:', window);
      
      // Validate serviceId before submission
      if (!window.service_id) {
        throw new Error('Service ID is required');
      }

      const { data, error } = await supabase
        .from('booking_windows')
        .update({
          days: window.days,
          start_time: window.start_time,
          end_time: window.end_time,
          max_bookings_per_slot: window.max_bookings_per_slot,
          start_date: window.start_date?.toISOString().split('T')[0] || null,
          end_date: window.end_date?.toISOString().split('T')[0] || null,
          blackout_periods: window.blackout_periods.map(bp => ({
            ...bp,
            startDate: bp.startDate.toISOString().split('T')[0],
            endDate: bp.endDate.toISOString().split('T')[0]
          }))
        })
        .eq('id', window.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error updating booking window:', error);
        throw error;
      }
      
      console.log('Successfully updated booking window:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-windows', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['all-booking-windows'] });
      setShowWindowDialog(false);
      setEditingWindow(null);
      resetWindowForm();
      toast({
        title: "Success",
        description: "Booking window updated successfully"
      });
    },
    onError: (error: any) => {
      console.error('Error updating booking window:', error);
      toast({
        title: "Error",
        description: `Failed to update booking window: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete window mutation
  const deleteWindowMutation = useMutation({
    mutationFn: async (windowId: string) => {
      const { error } = await supabase
        .from('booking_windows')
        .delete()
        .eq('id', windowId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-windows', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['all-booking-windows'] });
      toast({
        title: "Success",
        description: "Booking window deleted successfully"
      });
    },
    onError: (error: any) => {
      console.error('Error deleting booking window:', error);
      toast({
        title: "Error",
        description: `Failed to delete booking window: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const [formData, setFormData] = useState<Partial<BookingWindow>>({
    service_id: serviceId,
    days: [],
    start_time: "",
    end_time: "",
    max_bookings_per_slot: 10,
    start_date: null,
    end_date: null,
    blackout_periods: []
  });

  // Update formData when serviceId changes
  useEffect(() => {
    if (serviceId) {
      console.log('Setting formData service_id to:', serviceId);
      setFormData(prev => ({ ...prev, service_id: serviceId }));
    }
  }, [serviceId]);

  const resetWindowForm = () => {
    console.log('Resetting form with serviceId:', serviceId);
    setFormData({
      service_id: serviceId,
      days: [],
      start_time: "",
      end_time: "",
      max_bookings_per_slot: 10,
      start_date: null,
      end_date: null,
      blackout_periods: []
    });
    setStartToday(false);
    setOpenEnded(true);
    setNewBlackoutPeriod({});
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, days: [...(prev.days || []), day] }));
    } else {
      setFormData(prev => ({ ...prev, days: (prev.days || []).filter(d => d !== day) }));
    }
  };

  const handleAddBlackoutPeriod = () => {
    if (newBlackoutPeriod.startDate && newBlackoutPeriod.endDate) {
      setFormData(prev => ({
        ...prev,
        blackout_periods: [
          ...(prev.blackout_periods || []),
          {
            id: Date.now().toString(),
            startDate: newBlackoutPeriod.startDate!,
            endDate: newBlackoutPeriod.endDate!,
            reason: newBlackoutPeriod.reason || ""
          }
        ]
      }));
      setNewBlackoutPeriod({});
    }
  };

  const handleRemoveBlackoutPeriod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      blackout_periods: (prev.blackout_periods || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    console.log('Submitting form with data:', formData);
    console.log('Current serviceId:', serviceId);
    
    // Validate required fields
    if (!serviceId) {
      toast({
        title: "Error",
        description: "Service ID is missing. Please close and reopen the dialog.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.start_time || !formData.end_time || !formData.days?.length) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (days, start time, end time).",
        variant: "destructive"
      });
      return;
    }

    const windowData = {
      ...formData,
      service_id: serviceId, // Ensure serviceId is always set
      start_date: startToday ? new Date() : formData.start_date,
      end_date: openEnded ? null : formData.end_date
    } as BookingWindow;

    console.log('Final window data being submitted:', windowData);

    if (editingWindow?.id) {
      updateWindowMutation.mutate({ ...windowData, id: editingWindow.id });
    } else {
      createWindowMutation.mutate(windowData);
    }
  };

  const handleEditWindow = (window: any) => {
    console.log('Editing window:', window);
    setEditingWindow(window);
    setFormData({
      ...window,
      service_id: serviceId, // Ensure serviceId is set
      blackout_periods: window.blackout_periods || []
    });
    setStartToday(false);
    setOpenEnded(!window.end_date);
    setShowWindowDialog(true);
  };

  useEffect(() => {
    if (startToday) {
      setFormData(prev => ({ ...prev, start_date: new Date() }));
    }
  }, [startToday]);

  useEffect(() => {
    if (openEnded) {
      setFormData(prev => ({ ...prev, end_date: null }));
    }
  }, [openEnded]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Booking Windows</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Current Windows</h3>
            <Button onClick={() => setShowWindowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Window
            </Button>
          </div>

          {windows.length > 0 ? (
            <div className="space-y-3">
              {windows.map((window) => (
                <div key={window.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {window.days.join(", ")} • {window.start_time}-{window.end_time}
                        </Badge>
                        <Badge variant="secondary">
                          Max {window.max_bookings_per_slot} bookings
                        </Badge>
                      </div>
                      
                      {(window.start_date || window.end_date) && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {window.start_date && `From ${format(window.start_date, 'MMM d, yyyy')}`}
                          {window.end_date && ` to ${format(window.end_date, 'MMM d, yyyy')}`}
                          {!window.end_date && window.start_date && " (ongoing)"}
                        </div>
                      )}
                      
                      {window.blackout_periods && window.blackout_periods.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Blackout periods:</span>
                          <div className="mt-1 space-y-1">
                            {window.blackout_periods.map((bp, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-xs">
                                  {format(bp.startDate, 'MMM d')} - {format(bp.endDate, 'MMM d, yyyy')}
                                </Badge>
                                {bp.reason && (
                                  <span className="text-xs text-muted-foreground">({bp.reason})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWindow(window)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteWindowMutation.mutate(window.id!)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No booking windows configured yet
            </div>
          )}
        </div>

        {/* Window Form Dialog */}
        <Dialog open={showWindowDialog} onOpenChange={(open) => {
          setShowWindowDialog(open);
          if (!open) {
            resetWindowForm();
            setEditingWindow(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWindow ? 'Edit Booking Window' : 'Add Booking Window'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Days Selection */}
              <div>
                <Label className="text-base font-medium">Days of Week</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {dayOptions.map(day => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={(formData.days || []).includes(day.value)}
                        onCheckedChange={(checked) => handleDayToggle(day.value, !!checked)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Select 
                    value={formData.start_time || ""} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, start_time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>End Time</Label>
                  <Select 
                    value={formData.end_time || ""} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, end_time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Max Bookings */}
              <div>
                <Label>Max Bookings Per Slot</Label>
                <Input
                  type="number"
                  value={formData.max_bookings_per_slot || 10}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    max_bookings_per_slot: parseInt(e.target.value) || 10 
                  }))}
                  min="1"
                />
              </div>

              {/* Date Range */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Date Range (Optional)</Label>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="start-today"
                    checked={startToday}
                    onCheckedChange={setStartToday}
                  />
                  <Label htmlFor="start-today">Start Today</Label>
                </div>
                
                {!startToday && (
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(formData.start_date, "PPP") : "Select start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.start_date || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date || null }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="open-ended"
                    checked={openEnded}
                    onCheckedChange={setOpenEnded}
                  />
                  <Label htmlFor="open-ended">Open-ended (no end date)</Label>
                </div>
                
                {!openEnded && (
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.end_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, "PPP") : "Select end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date || null }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Blackout Periods */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Blackout Periods</Label>
                
                {formData.blackout_periods && formData.blackout_periods.length > 0 && (
                  <div className="space-y-2">
                    {formData.blackout_periods.map((bp, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">
                            {format(bp.startDate, 'MMM d, yyyy')} - {format(bp.endDate, 'MMM d, yyyy')}
                          </div>
                          {bp.reason && (
                            <div className="text-sm text-muted-foreground">{bp.reason}</div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBlackoutPeriod(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Blackout Period */}
                <div className="border rounded p-4 space-y-3">
                  <h4 className="font-medium">Add Blackout Period</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newBlackoutPeriod.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBlackoutPeriod.startDate ? 
                              format(newBlackoutPeriod.startDate, "PPP") : 
                              "Start date"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newBlackoutPeriod.startDate}
                            onSelect={(date) => setNewBlackoutPeriod(prev => ({ 
                              ...prev, 
                              startDate: date 
                            }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newBlackoutPeriod.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBlackoutPeriod.endDate ? 
                              format(newBlackoutPeriod.endDate, "PPP") : 
                              "End date"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newBlackoutPeriod.endDate}
                            onSelect={(date) => setNewBlackoutPeriod(prev => ({ 
                              ...prev, 
                              endDate: date 
                            }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Reason (Optional)</Label>
                    <Input
                      placeholder="e.g., Private event, Holiday closure"
                      value={newBlackoutPeriod.reason || ""}
                      onChange={(e) => setNewBlackoutPeriod(prev => ({ 
                        ...prev, 
                        reason: e.target.value 
                      }))}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handleAddBlackoutPeriod}
                    disabled={!newBlackoutPeriod.startDate || !newBlackoutPeriod.endDate}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Blackout Period
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.start_time || !formData.end_time || !formData.days?.length || createWindowMutation.isPending || updateWindowMutation.isPending}
                >
                  {createWindowMutation.isPending || updateWindowMutation.isPending 
                    ? 'Saving...' 
                    : editingWindow ? 'Update Window' : 'Add Window'
                  }
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowWindowDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
