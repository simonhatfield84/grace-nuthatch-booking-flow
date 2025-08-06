
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Booking } from '@/types/booking';

interface EditBookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onUpdate: (booking: any) => void;
}

export const EditBookingForm = ({ 
  open, 
  onOpenChange, 
  booking, 
  onUpdate 
}: EditBookingFormProps) => {
  const [formData, setFormData] = useState({
    guest_name: '',
    phone: '',
    email: '',
    notes: '',
    party_size: 1
  });

  useEffect(() => {
    if (booking) {
      setFormData({
        guest_name: booking.guest_name,
        phone: booking.phone || '',
        email: booking.email || '',
        notes: booking.notes || '',
        party_size: booking.party_size
      });
    }
  }, [booking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'party_size' ? parseInt(value) || 1 : value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest_name">Guest Name</Label>
            <Input
              id="guest_name"
              name="guest_name"
              value={formData.guest_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="party_size">Party Size</Label>
            <Input
              id="party_size"
              name="party_size"
              type="number"
              min="1"
              max="20"
              value={formData.party_size}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
