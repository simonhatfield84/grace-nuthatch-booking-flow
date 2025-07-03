
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
  serviceId: string;
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

const timeSlots = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00", "23:30"
];

export function BookingWindowManager({ serviceId, open, onOpenChange }: BookingWindowManagerProps) {
  const queryClient = useQueryClient();
  const [editingWindow, setEditingWindow] = useState<BookingWindow | null>(null);
  const [showWindowDialog, setShowWindowDialog] = useState(false);
  const [startToday, setStartToday] = useState(false);
  const [openEnded, setOpenEnded] = useState(true);
  const [newBlackoutPeriod, setNewBlackoutPeriod] = useState<Partial<BlackoutPeriod>>({});

  // Fetch booking windows for this service
  const { data: windows = [] } = useQuery({
    queryKey: ['booking-windows', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_windows')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at');
      
      if (error) throw error;
      
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
    enabled: open
  });

  // Create window mutation
  const createWindowMutation = useMutation({
    mutationFn: async (window: Omit<BookingWindow, 'id'>) => {
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
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-windows', serviceId] });
      setShowWindowDialog(false);
      resetWindowForm();
    }
  });

  // Update window mutation
  const updateWindowMutation = useMutation({
    mutationFn: async (window: BookingWindow) => {
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
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-windows', serviceId] });
      setShowWindowDialog(false);
      setEditingWindow(null);
      resetWindowForm();
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

  const resetWindowForm = () => {
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
    const windowData = {
      ...formData,
      start_date: startToday ? new Date() : formData.start_date,
      end_date: openEnded ? null : formData.end_date
    } as BookingWindow;

    if (editingWindow?.id) {
      updateWindowMutation.mutate({ ...windowData, id: editingWindow.id });
    } else {
      createWindowMutation.mutate(windowData);
    }
  };

  const handleEditWindow = (window: any) => {
    setEditingWindow(window);
    setFormData({
      ...window,
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
                  disabled={!formData.start_time || !formData.end_time || !formData.days?.length}
                >
                  {editingWindow ? 'Update Window' : 'Add Window'}
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
