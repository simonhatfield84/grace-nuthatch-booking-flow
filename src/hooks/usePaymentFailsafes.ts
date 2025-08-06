
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePaymentFailsafes = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Set up interval to run payment timeout handler every 5 minutes
    const timeoutInterval = setInterval(async () => {
      try {
        console.log('🔄 Running payment timeout handler...');
        const { error } = await supabase.functions.invoke('payment-timeout-handler');
        if (error) {
          console.error('Payment timeout handler error:', error);
        }
      } catch (error) {
        console.error('Error invoking payment timeout handler:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Set up interval to run payment reconciliation every 10 minutes
    const reconciliationInterval = setInterval(async () => {
      try {
        console.log('🔍 Running payment status reconciliation...');
        const { error } = await supabase.functions.invoke('payment-status-reconciliation');
        if (error) {
          console.error('Payment reconciliation error:', error);
        }
      } catch (error) {
        console.error('Error invoking payment reconciliation:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearInterval(timeoutInterval);
      clearInterval(reconciliationInterval);
    };
  }, [user]);
};
