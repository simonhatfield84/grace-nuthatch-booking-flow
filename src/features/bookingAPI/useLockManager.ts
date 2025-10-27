import { useState, useEffect, useCallback, useRef } from 'react';
import { createLock, extendLock, releaseLock } from './index';
import { useToast } from '@/hooks/use-toast';

export function useLockManager() {
  const [lockToken, setLockToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const extendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.floor((expiry - now) / 1000);
      setSecondsRemaining(Math.max(0, remaining));
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [expiresAt]);

  // Auto-extend lock every 4 minutes
  useEffect(() => {
    if (!lockToken) return;

    extendIntervalRef.current = setInterval(async () => {
      try {
        const result = await extendLock(lockToken);
        if (result.ok && result.expiresAt) {
          setExpiresAt(result.expiresAt);
          console.log('🔄 Lock extended:', result.expiresAt);
        }
      } catch (error) {
        console.error('Failed to extend lock:', error);
      }
    }, 4 * 60 * 1000); // 4 minutes

    return () => {
      if (extendIntervalRef.current) {
        clearInterval(extendIntervalRef.current);
      }
    };
  }, [lockToken]);

  // Release lock on unmount or page close
  useEffect(() => {
    const handleUnload = () => {
      if (lockToken) {
        // Use navigator.sendBeacon for reliable cleanup
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/locks`;
        const payload = JSON.stringify({
          action: 'release',
          lockToken,
          reason: 'page_unload',
        });
        navigator.sendBeacon(url, payload);
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (lockToken) {
        releaseLock(lockToken).catch(console.error);
      }
    };
  }, [lockToken]);

  const acquireLock = useCallback(async (
    venueSlug: string,
    serviceId: string,
    date: string,
    time: string,
    partySize: number
  ): Promise<boolean> => {
    setIsCreating(true);

    try {
      const result = await createLock(venueSlug, serviceId, date, time, partySize);

      if (result.ok && result.lockToken) {
        setLockToken(result.lockToken);
        setExpiresAt(result.expiresAt!);
        return true;
      }

      // Handle slot locked (409)
      if (result.code === 'slot_locked') {
        // Retry after 300ms
        await new Promise(resolve => setTimeout(resolve, 300));
        const retryResult = await createLock(venueSlug, serviceId, date, time, partySize);

        if (retryResult.ok && retryResult.lockToken) {
          setLockToken(retryResult.lockToken);
          setExpiresAt(retryResult.expiresAt!);
          return true;
        }

        // Still locked after retry
        toast({
          title: 'Time slot unavailable',
          description: 'This time is being booked by another guest. Please select a different time.',
          variant: 'destructive',
        });
        return false;
      }

      // Other errors
      toast({
        title: 'Unable to reserve time',
        description: result.message || 'Please try again',
        variant: 'destructive',
      });
      return false;

    } catch (error: any) {
      console.error('Lock creation error:', error);
      toast({
        title: 'Connection error',
        description: 'Please check your connection and try again',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [toast]);

  const releaseCurrentLock = useCallback(async () => {
    if (lockToken) {
      await releaseLock(lockToken);
      setLockToken(null);
      setExpiresAt(null);
      setSecondsRemaining(0);
    }
  }, [lockToken]);

  return {
    lockToken,
    expiresAt,
    secondsRemaining,
    isCreating,
    acquireLock,
    releaseLock: releaseCurrentLock,
  };
}
