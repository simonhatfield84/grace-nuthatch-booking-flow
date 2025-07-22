
import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type WalkInStep = 'guest-search' | 'conflict-resolution' | 'validation';

interface UseWalkInFlowProps {
  selectedDate: string;
  selectedTime?: string;
  preselectedTableId?: number;
  onComplete?: () => void;
}

export function useWalkInFlow({ selectedDate, selectedTime, preselectedTableId, onComplete }: UseWalkInFlowProps) {
  const [currentStep, setCurrentStep] = useState<WalkInStep>('guest-search');
  const [walkInData, setWalkInData] = useState<any>({});
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { createBooking } = useBookings(selectedDate);

  const handleGuestSelection = async (guest: any, newGuestData?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const guestInfo = guest || newGuestData;
      const updatedWalkInData = {
        ...guestInfo,
        date: selectedDate,
        time: selectedTime || new Date().toTimeString().slice(0, 5),
        tableId: preselectedTableId,
        status: 'seated',
        partySize: guestInfo?.partySize || 2
      };

      setWalkInData(updatedWalkInData);

      // Check for conflicts
      const detectedConflicts = await checkForConflicts(updatedWalkInData);
      
      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        setCurrentStep('conflict-resolution');
      } else {
        setCurrentStep('validation');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConflictResolution = async (resolution: any) => {
    setIsLoading(true);
    
    try {
      // Apply resolution logic
      const resolvedData = await applyResolution(walkInData, resolution);
      setWalkInData(resolvedData);
      setCurrentStep('validation');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidationComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Handle guest creation/update if guest details are provided
      let finalGuestId = walkInData.guestId;
      
      if ((walkInData.phone || walkInData.email) && walkInData.guestName) {
        // Get user's venue ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user?.id)
          .single();

        if (profile?.venue_id) {
          if (walkInData.guestId) {
            // Update existing guest
            await supabase
              .from('guests')
              .update({
                name: walkInData.guestName,
                phone: walkInData.phone || null,
                email: walkInData.email || null,
                notes: walkInData.notes || null,
                updated_at: new Date().toISOString()
              })
              .eq('id', walkInData.guestId);
          } else {
            // Create new guest
            const { data: newGuest } = await supabase
              .from('guests')
              .insert({
                name: walkInData.guestName,
                phone: walkInData.phone || null,
                email: walkInData.email || null,
                notes: walkInData.notes || null,
                venue_id: profile.venue_id
              })
              .select('id')
              .single();
            
            finalGuestId = newGuest?.id;
          }
        }
      }

      await createBooking({
        guest_name: walkInData.guestName || walkInData.name || 'WALK-IN',
        email: walkInData.email,
        phone: walkInData.phone,
        party_size: walkInData.partySize || 2,
        booking_date: walkInData.date,
        booking_time: walkInData.time,
        service: 'Walk-in',
        status: 'seated',
        original_table_id: walkInData.tableId,
        notes: walkInData.notes,
        duration_minutes: walkInData.duration || 120
      });

      toast({
        title: "Walk-in seated",
        description: `${walkInData.partySize || 2} guests seated successfully${finalGuestId ? ' and guest profile updated' : ''}`,
      });

      resetFlow();
      onComplete?.();
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to create walk-in",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    const steps: WalkInStep[] = ['guest-search', 'conflict-resolution', 'validation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: WalkInStep[] = ['guest-search', 'conflict-resolution', 'validation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const resetFlow = () => {
    setCurrentStep('guest-search');
    setWalkInData({});
    setConflicts([]);
    setError(null);
    setIsLoading(false);
  };

  return {
    currentStep,
    walkInData,
    conflicts,
    isLoading,
    error,
    handleGuestSelection,
    handleConflictResolution,
    handleValidationComplete,
    nextStep,
    prevStep,
    resetFlow
  };
}

// Helper functions
async function checkForConflicts(walkInData: any) {
  // Implement conflict detection logic
  return [];
}

async function applyResolution(walkInData: any, resolution: any) {
  // Implement resolution application logic
  return walkInData;
}
