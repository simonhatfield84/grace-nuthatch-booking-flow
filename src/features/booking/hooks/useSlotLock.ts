import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LockData {
  lockToken: string;
  expiresAt: string;
  holdMinutes: number;
}

const LOCK_STORAGE_KEY = 'grace.lock';

export const useSlotLock = () => {
  const { toast } = useToast();
  const [lockData, setLockData] = useState<LockData | null>(() => {
    // Restore from localStorage
    const stored = localStorage.getItem(LOCK_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only restore if not expired
        if (new Date(parsed.expiresAt) > new Date()) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed to restore lock:', err);
      }
    }
    return null;
  });

  // Persist to localStorage whenever lockData changes
  useEffect(() => {
    if (lockData) {
      localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lockData));
    } else {
      localStorage.removeItem(LOCK_STORAGE_KEY);
    }
  }, [lockData]);

  const createLock = useCallback(async (
    venueSlug: string,
    serviceId: string,
    date: string,
    time: string,
    partySize: number
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('locks/create', {
        body: { venueSlug, serviceId, date, time, partySize }
      });

      if (error || !data?.ok) {
        if (data?.code === 'slot_locked') {
          toast({
            title: "Time slot unavailable",
            description: "That time was just taken by another guest. Please choose another time.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Unable to reserve time",
            description: data?.message || "Please try again",
            variant: "destructive"
          });
        }
        return false;
      }

      setLockData({
        lockToken: data.lockToken,
        expiresAt: data.expiresAt,
        holdMinutes: data.holdMinutes
      });

      return true;
    } catch (err) {
      console.error('Lock creation error:', err);
      toast({
        title: "Error",
        description: "Failed to reserve time slot",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const releaseLock = useCallback(async (reason: string = 'released') => {
    if (!lockData) return;

    try {
      await supabase.functions.invoke('locks/release', {
        body: { lockToken: lockData.lockToken, reason }
      });
      console.log('✅ Lock released:', reason);
    } catch (err) {
      console.error('Lock release error:', err);
    } finally {
      setLockData(null);
    }
  }, [lockData]);

  const handleExpiry = useCallback(() => {
    releaseLock('expired');
    toast({
      title: "Hold expired",
      description: "Your time slot hold has expired. Please choose another time.",
      variant: "destructive"
    });
  }, [releaseLock, toast]);

  return {
    lockData,
    createLock,
    releaseLock,
    handleExpiry
  };
};
