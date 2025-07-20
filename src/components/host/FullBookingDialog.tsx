
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useTables } from '@/hooks/useTables';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { useEmailService } from '@/hooks/useEmailService';
import { EnhancedTimeSlotSelector } from "@/components/bookings/EnhancedTimeSlotSelector";
import { ManualTableSelector } from './ManualTableSelector';
import { TableConflictResolver } from './TableConflictResolver';

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
    table_ids: [] as number[]
  });

  const [selectedTab, setSelectedTab] = useState('quick');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);

  const { tables } = useTables();
  const { services } = useServices();
  const { toast } = useToast();
  const { sendBookingConfirmation } = useEmailService();

  const handleSubmit = async () => {
    if (!formData.guest_name.trim()) {
      toast({
        title: "Error",
        description: "Guest name is required",
        variant: "destructive"
      });
      return;
    }

    // Check if manual table selection has conflicts
    if (selectedTab === 'manual' && conflicts.length > 0) {
      toast({
        title: "Table Conflicts",
        description: "Please resolve table conflicts before creating the booking",
        variant: "destructive"
      });
      return;
    }

    try {
      const tableId = selectedTab === 'manual' && formData.table_ids.length > 0 
        ? formData.table_ids[0] // For now, take the first selected table
        : null;

      const bookingData = {
        guest_name: formData.guest_name,
        party_size: formData.party_size,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: formData.booking_time,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        service: formData.service || 'Dinner',
        status: 'confirmed',
        original_table_id: tableId
      };

      await onCreateBooking(bookingData);

      // Send confirmation email if requested and email is provided
      if (sendConfirmationEmail && formData.email) {
        try {
          // Get venue info - we need to pass this somehow
          await sendBookingConfirmation(
            formData.email,
            {
              guest_name: formData.guest_name,
              venue_name: "Your Venue", // TODO: Get actual venue name
              booking_date: format(selectedDate, 'EEEE, MMMM do, yyyy'),
              booking_time: formData.booking_time,
              party_size: formData.party_size.toString(),
              booking_reference: 'TBD' // TODO: Generate or retrieve booking reference
            },
            "venue-slug" // TODO: Get actual venue slug
          );
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          toast({
            title: "Booking Created",
            description: "Booking created successfully, but confirmation email could not be sent.",
            variant: "destructive"
          });
        }
      }

      // Reset form
      setFormData({
        guest_name: '',
        party_size: 2,
        booking_time: '19:00',
        phone: '',
        email: '',
        notes: '',
        service: '',
        table_ids: []
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  const handleTableSelectionChange = (tableIds: number[]) => {
    setFormData({...formData, table_ids: tableIds});
  };

  const handleConflictResolve = (tableId: number, resolution: 'move' | 'override' | 'suggest') => {
    if (resolution === 'suggest') {
      // Remove conflicted table and let manual selector suggest alternatives
      const filteredTables = formData.table_ids.filter(id => id !== tableId);
      setFormData({...formData, table_ids: filteredTables});
    } else if (resolution === 'override') {
      // Keep the table selection but remove from conflicts
      setConflicts(conflicts.filter(c => c.tableId !== tableId));
    }
    // For 'move', would need to implement booking move functionality
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
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

          {/* Table Assignment Options */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Table Assignment</Label>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quick">Quick Assign</TabsTrigger>
                <TabsTrigger value="manual">Manual Selection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="quick" className="mt-4">
                <Select 
                  value={formData.table_ids[0]?.toString() || ''} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    table_ids: value ? [parseInt(value)] : []
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-assign best table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables
                      .filter(table => table.seats >= formData.party_size)
                      .map((table) => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          {table.label} ({table.seats} seats)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              
              <TabsContent value="manual" className="mt-4">
                <ManualTableSelector
                  partySize={formData.party_size}
                  selectedTableIds={formData.table_ids}
                  onTableSelectionChange={handleTableSelectionChange}
                  bookingDate={format(selectedDate, 'yyyy-MM-dd')}
                  bookingTime={formData.booking_time}
                  className="border-0 shadow-none p-0"
                />
                
                {conflicts.length > 0 && (
                  <TableConflictResolver
                    conflicts={conflicts}
                    onResolveConflict={handleConflictResolve}
                    onSuggestAlternative={() => {
                      // Clear current selection to trigger new suggestions
                      setFormData({...formData, table_ids: []});
                    }}
                    className="mt-4"
                  />
                )}
              </TabsContent>
            </Tabs>
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

          {/* Email Confirmation Option */}
          {formData.email && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendConfirmationEmail"
                checked={sendConfirmationEmail}
                onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="sendConfirmationEmail" className="text-sm">
                Send confirmation email to guest
              </Label>
            </div>
          )}
          
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
