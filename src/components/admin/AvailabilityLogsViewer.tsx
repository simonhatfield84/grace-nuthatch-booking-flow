import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

interface AvailabilityLog {
  id: string;
  venue_slug: string;
  service_id: string;
  date: string;
  time: string;
  party_size: number;
  action: string;
  status: string;
  result_slots: number | null;
  took_ms: number | null;
  cached: boolean;
  occurred_at: string;
  error_text: string | null;
}

export function AvailabilityLogsViewer() {
  const [sinceDate, setSinceDate] = useState<Date>(subDays(new Date(), 2));
  const [actionFilter, setActionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['availability-logs', sinceDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('admin_list_availability_logs' as any, {
          _venue_id: null,
          _since: sinceDate.toISOString(),
          _limit: 2000
        });

      if (error) throw error;
      return (data || []) as AvailabilityLog[];
    },
    refetchInterval: 30000
  });

  const quickStats = {
    holdsCreated: logs.filter(l => 
      l.action === 'held' && 
      new Date(l.occurred_at) > subDays(new Date(), 1)
    ).length,
    released: logs.filter(l => 
      l.action === 'released' && 
      new Date(l.occurred_at) > subDays(new Date(), 1)
    ).length,
    expired: logs.filter(l => 
      l.action === 'expired' && 
      new Date(l.occurred_at) > subDays(new Date(), 1)
    ).length,
    avgCheckoutTime: (() => {
      const checkLogs = logs.filter(l => 
        l.action === 'check' && 
        l.took_ms && 
        new Date(l.occurred_at) > subDays(new Date(), 1)
      );
      if (checkLogs.length === 0) return 0;
      const sum = checkLogs.reduce((acc, l) => acc + (l.took_ms || 0), 0);
      return Math.round(sum / checkLogs.length);
    })()
  };

  const filteredLogs = logs.filter(log => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (statusFilter && log.status !== statusFilter) return false;
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Time', 'Venue', 'Date', 'Time Slot', 'Party', 'Action', 'Status', 'Slots', 'Took (ms)', 'Cached', 'Error'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.occurred_at), 'yyyy-MM-dd HH:mm:ss'),
      log.venue_slug,
      log.date,
      log.time,
      log.party_size,
      log.action,
      log.status,
      log.result_slots ?? '',
      log.took_ms ?? '',
      log.cached ? 'Yes' : 'No',
      log.error_text ?? ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `availability-logs-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredLogs.length} logs to CSV`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Holds Created</p>
                <p className="text-2xl font-bold">{quickStats.holdsCreated}</p>
                <p className="text-xs text-muted-foreground">Last 24h</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Released</p>
                <p className="text-2xl font-bold">{quickStats.released}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{quickStats.expired}</p>
                <p className="text-xs text-muted-foreground">Abandoned</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Check</p>
                <p className="text-2xl font-bold">{quickStats.avgCheckoutTime}ms</p>
                <p className="text-xs text-muted-foreground">Response</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Availability Logs</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>From Date/Time</Label>
              <Input
                type="datetime-local"
                value={format(sinceDate, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setSinceDate(new Date(e.target.value))}
              />
            </div>

            <div>
              <Label>Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="held">Held</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cache_invalidate">Cache Invalidate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="conflict">Conflict</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setActionFilter('');
                  setStatusFilter('');
                  setSinceDate(subDays(new Date(), 2));
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs found matching your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Slots</TableHead>
                    <TableHead>Took</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {format(new Date(log.occurred_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium">{log.venue_slug}</TableCell>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.time}</TableCell>
                      <TableCell>{log.party_size}</TableCell>
                      <TableCell>
                        <Badge variant={
                          log.action === 'held' ? 'default' :
                          log.action === 'released' ? 'secondary' :
                          log.action === 'expired' ? 'destructive' :
                          'outline'
                        }>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          log.status === 'ok' ? 'default' :
                          log.status === 'error' ? 'destructive' :
                          'secondary'
                        }>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.result_slots ?? '-'}</TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {log.took_ms ? `${log.took_ms}ms` : '-'}
                          {log.cached && <Badge variant="outline" className="ml-1 text-xs">cached</Badge>}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.error_text || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
