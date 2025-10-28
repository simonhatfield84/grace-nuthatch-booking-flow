import { useEffect, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LOCK_EXTEND_INTERVAL_SECONDS, LOCK_COUNTDOWN_WARNING_SECONDS } from '@/constants/lockConfig';
import { logger } from "@/lib/logger";

interface HoldBannerProps {
  lockToken: string;
  expiresAt: string;
  onExpiry: () => void;
}

export const HoldBanner = ({ lockToken, expiresAt, onExpiry }: HoldBannerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isWarning, setIsWarning] = useState(false);

  // Calculate remaining time
  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setRemainingSeconds(diff);
      setIsWarning(diff <= LOCK_COUNTDOWN_WARNING_SECONDS);
      
      if (diff === 0) {
        onExpiry();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpiry]);

  // Heartbeat to extend lock
  useEffect(() => {
    const extendLock = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('locks/extend', {
          body: { lockToken }
        });

        if (error || !data?.ok) {
          logger.warn('Failed to extend lock', { error: error?.message, lockToken: lockToken.substring(0, 8) });
        } else {
          logger.debug('Lock extended', { expiresAt: data.expiresAt, lockToken: lockToken.substring(0, 8) });
        }
      } catch (err) {
        logger.error('Lock extension error', { error: err instanceof Error ? err.message : String(err), lockToken: lockToken.substring(0, 8) });
      }
    };

    const interval = setInterval(extendLock, LOCK_EXTEND_INTERVAL_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [lockToken]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Alert 
      variant={isWarning ? "destructive" : "default"}
      className="mb-4"
      role="status"
      aria-live="polite"
    >
      <Clock className="h-4 w-4" />
      <AlertDescription>
        We're holding your table for <strong>{formatTime(remainingSeconds)}</strong>
        {isWarning && ' — Please complete your booking soon!'}
      </AlertDescription>
    </Alert>
  );
};
