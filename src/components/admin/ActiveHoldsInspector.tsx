import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

interface ActiveHold {
  id: string;
  venue_slug: string;
  service_title: string;
  booking_date: string;
  start_time: string;
  party_size: number;
  locked_at: string;
  expires_at: string;
  lock_token: string;
}

export const ActiveHoldsInspector = () => {
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState<Record<string, number>>({});

  // Fetch active holds
  const { data: holds = [], isLoading, refetch } = useQuery({
    queryKey: ['active-holds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('admin_list_active_holds' as any, { 
          _venue_id: null 
        });

      if (error) {
        console.error('Failed to fetch active holds:', error);
        throw error;
      }

      return (data || []).map(hold => ({
        id: hold.id,
        venue_slug: hold.venue_slug,
        service_title: hold.service_title,
        booking_date: hold.booking_date,
        start_time: hold.start_time,
        party_size: hold.party_size,
        locked_at: hold.locked_at,
        expires_at: hold.expires_at,
        lock_token: hold.lock_token
      }));
    },
    refetchInterval: 5000
  });

  // Update countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      const newCountdown: Record<string, number> = {};
      holds.forEach(hold => {
        const remaining = Math.max(0, Math.floor(
          (new Date(hold.expires_at).getTime() - new Date().getTime()) / 1000
        ));
        newCountdown[hold.id] = remaining;
      });
      setCountdown(newCountdown);
    }, 1000);

    return () => clearInterval(timer);
  }, [holds]);

  // Force release mutation
  const releaseMutation = useMutation({
    mutationFn: async (lockId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('locks/release', {
        body: { lockId, reason: 'admin_force' },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error || !data?.ok) {
        throw new Error(data?.message || error?.message || 'Failed to release lock');
      }
    },
    onSuccess: () => {
      toast.success('Hold released successfully');
      queryClient.invalidateQueries({ queryKey: ['active-holds'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to release hold: ${error.message}`);
    }
  });

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Active Holds</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading active holds...</div>
        ) : holds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active holds at this time
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Locked</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holds.map(hold => (
                  <TableRow key={hold.id}>
                    <TableCell className="font-medium">{hold.venue_slug}</TableCell>
                    <TableCell>{hold.service_title}</TableCell>
                    <TableCell>{hold.booking_date}</TableCell>
                    <TableCell>{hold.start_time}</TableCell>
                    <TableCell>{hold.party_size}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(hold.locked_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <span className={countdown[hold.id] < 60 ? 'text-destructive font-semibold' : 'font-medium'}>
                        {formatCountdown(countdown[hold.id] || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Release
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Force Release Hold?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will immediately return the slot to inventory. The guest
                              will lose their hold and may need to re-select their time.
                              <div className="mt-4 p-3 bg-muted rounded-lg">
                                <div className="text-sm space-y-1">
                                  <div><strong>Date:</strong> {hold.booking_date}</div>
                                  <div><strong>Time:</strong> {hold.start_time}</div>
                                  <div><strong>Party Size:</strong> {hold.party_size}</div>
                                </div>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => releaseMutation.mutate(hold.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Force Release
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
