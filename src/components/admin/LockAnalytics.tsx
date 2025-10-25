import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Unlock, Clock, CheckCircle2 } from 'lucide-react';

export const LockAnalytics = () => {
  const { data: stats } = useQuery({
    queryKey: ['lock-analytics'],
    queryFn: async () => {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const { data: locks, error } = await supabase
        .from('booking_locks' as any)
        .select('*')
        .gte('created_at', oneDayAgo.toISOString());

      if (error) throw error;

      const created = locks?.length || 0;
      const released = locks?.filter((l: any) => l.released_at && l.reason !== 'expired').length || 0;
      const expired = locks?.filter((l: any) => l.reason === 'expired').length || 0;
      const paid = locks?.filter((l: any) => l.reason === 'paid').length || 0;

      // Calculate average time to checkout
      const paidLocks = locks?.filter((l: any) => l.reason === 'paid' && l.released_at) || [];
      const avgCheckoutTime = paidLocks.length > 0
        ? paidLocks.reduce((sum: number, lock: any) => {
            const holdTime = new Date(lock.released_at!).getTime() - new Date(lock.locked_at).getTime();
            return sum + holdTime;
          }, 0) / paidLocks.length / 1000 / 60 // Convert to minutes
        : 0;

      return {
        created,
        released,
        expired,
        paid,
        avgCheckoutTime: Math.round(avgCheckoutTime * 10) / 10
      };
    },
    refetchInterval: 60000 // Refresh every minute
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Holds Created</CardTitle>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.created || 0}</div>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.paid || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.created ? Math.round((stats.paid / stats.created) * 100) : 0}% conversion
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Expired</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.expired || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.created ? Math.round((stats.expired / stats.created) * 100) : 0}% abandoned
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg. Checkout Time</CardTitle>
          <Unlock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.avgCheckoutTime || 0}m</div>
          <p className="text-xs text-muted-foreground">For completed bookings</p>
        </CardContent>
      </Card>
    </div>
  );
};
