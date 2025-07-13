import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useTables } from '@/hooks/useTables';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { EnhancedTimeSlotSelector } from "@/components/bookings/EnhancedTimeSlotSelector";

interface FullBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onCreateBooking: (bookingData: any) => void;
}

export const FullBookingDialog = ({ 
  open, 
  onOpenChange, 
  selectedDate,
  onCreateBooking 
}: FullBookingDialogProps) => {
  const [formData, setFormData] = useState({
    guest_name: '',
    party_size: 2,
    booking_time: '19:00',
    phone: '',
    email: '',
    notes: '',
    service: '',
    table_id: null as number | null
  });

  const { tables } = useTables();
  const { services } = useServices();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.guest_name.trim()) {
      toast({
        title: "Error",
        description: "Guest name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      await onCreateBooking({
        guest_name: formData.guest_name,
        party_size: formData.party_size,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: formData.booking_time,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        service: formData.service || 'Dinner',
        status: 'confirmed',
        original_table_id: formData.table_id
      });

      // Reset form
      setFormData({
        guest_name: '',
        party_size: 2,
        booking_time: '19:00',
        phone: '',
        email: '',
        notes: '',
        service: '',
        table_id: null
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Date: {format(selectedDate, 'EEEE, MMMM do, yyyy')}
          </div>
          
          <div>
            <Label htmlFor="guest_name">Guest Name *</Label>
            <Input
              id="guest_name"
              value={formData.guest_name}
              onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
              placeholder="Enter guest name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="party_size">Party Size</Label>
              <Input
                id="party_size"
                type="number"
                min="1"
                value={formData.party_size}
                onChange={(e) => setFormData({...formData, party_size: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="booking_time">Time *</Label>
              <Input
                id="booking_time"
                type="time"
                value={formData.booking_time}
                onChange={(e) => setFormData({...formData, booking_time: e.target.value})}
              />
            </div>
          </div>

          {/* Enhanced time availability display for hosts */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Time Selection</Label>
            <EnhancedTimeSlotSelector
              selectedDate={selectedDate}
              selectedTime={formData.booking_time}
              onTimeSelect={(time) => setFormData({...formData, booking_time: time})}
              partySize={formData.party_size}
            />
          </div>

          <div>
            <Label htmlFor="service">Service</Label>
            <Select value={formData.service} onValueChange={(value) => setFormData({...formData, service: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.title}>
                    {service.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="table_id">Preferred Table (Optional)</Label>
            <Select value={formData.table_id?.toString() || ''} onValueChange={(value) => setFormData({...formData, table_id: value ? parseInt(value) : null})}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-assign table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    {table.label} ({table.seats} seats)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Special requests, dietary requirements..."
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Create Booking
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
