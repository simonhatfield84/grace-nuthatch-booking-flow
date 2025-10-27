import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AvailabilityApiClient } from '@/services/api/availabilityApiClient';
import { Loader2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TimeStepProps {
  venueSlug: string;
  serviceId: string;
  date: Date;
  partySize: number;
  onContinue: (time: string, lockToken: string, expiresAt: string) => void;
  onBack: () => void;
}

export function TimeStep({ venueSlug, serviceId, date, partySize, onContinue, onBack }: TimeStepProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isCreatingLock, setIsCreatingLock] = useState(false);
  const { toast } = useToast();
  
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const { data: slots = [], isLoading, error } = useQuery({
    queryKey: ['time-slots-v5', venueSlug, serviceId, dateStr, partySize],
    queryFn: async () => {
      const response = await AvailabilityApiClient.checkAvailability({
        venueSlug,
        serviceId,
        date: dateStr,
        partySize
      });
      return response.slots || [];
    },
    retry: 1
  });
  
  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time);
    setIsCreatingLock(true);
    
    const attemptLock = async (retryCount = 0): Promise<boolean> => {
      try {
        const { data, error } = await supabase.functions.invoke('locks/create', {
          body: {
            venueSlug,
            serviceId,
            date: dateStr,
            time,
            partySize
          }
        });
        
        if (error) throw error;
        
        // Handle 409 conflict - slot taken
        if (!data?.ok && data?.code === 'slot_conflict') {
          // Retry once after 300ms
          if (retryCount === 0) {
            console.log('⏳ Slot conflict detected, retrying in 300ms...');
            await new Promise(resolve => setTimeout(resolve, 300));
            return await attemptLock(1);
          }
          
          // Max retries reached
          toast({
            title: 'Time slot taken',
            description: 'That time was just taken. Please select another slot.',
            variant: 'destructive'
          });
          return false;
        }
        
        if (!data?.ok) {
          toast({
            title: 'Time slot unavailable',
            description: data?.message || 'This time slot is no longer available',
            variant: 'destructive'
          });
          return false;
        }
        
        onContinue(time, data.lockToken, data.expiresAt);
        return true;
      } catch (error: any) {
        console.error('Lock creation failed:', error);
        toast({
          title: 'Error',
          description: 'Failed to hold time slot. Please try again.',
          variant: 'destructive'
        });
        return false;
      }
    };
    
    const success = await attemptLock();
    if (!success) {
      setSelectedTime(null);
    }
    setIsCreatingLock(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-destructive">Failed to load time slots</p>
        <Button onClick={onBack} variant="outline">Go Back</Button>
      </div>
    );
  }
  
  const availableSlots = slots.filter(s => s.available);
  
  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">No time slots available for this date</p>
        <Button onClick={onBack} variant="outline">Choose Different Date</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Select Time</h2>
        <Button onClick={onBack} variant="ghost" size="sm">Change Date</Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {availableSlots.map(slot => (
          <Button
            key={slot.time}
            variant={selectedTime === slot.time ? 'default' : 'outline'}
            onClick={() => handleTimeSelect(slot.time)}
            disabled={isCreatingLock}
            className="h-14 text-base"
          >
            {isCreatingLock && selectedTime === slot.time ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              slot.time
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
