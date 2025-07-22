
import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';

type WalkInStep = 'guest-search' | 'conflict-resolution' | 'validation';

interface UseWalkInFlowProps {
  selectedDate: string;
  selectedTime?: string;
  preselectedTableId?: number;
}

export function useWalkInFlow({ selectedDate, selectedTime, preselectedTableId }: UseWalkInFlowProps) {
  const [currentStep, setCurrentStep] = useState<WalkInStep>('guest-search');
  const [walkInData, setWalkInData] = useState<any>({});
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        status: 'seated'
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
      await createBooking({
        guest_name: walkInData.name || walkInData.guestName,
        email: walkInData.email,
        phone: walkInData.phone,
        party_size: walkInData.partySize,
        booking_date: walkInData.date,
        booking_time: walkInData.time,
        service: 'Walk-in',
        status: 'seated',
        original_table_id: walkInData.tableId,
        notes: walkInData.notes,
        duration_minutes: 120
      });

      resetFlow();
    } catch (err: any) {
      setError(err.message);
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
