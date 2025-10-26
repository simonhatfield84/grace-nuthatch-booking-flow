import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, PlayCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { FLAGS, getAllFlags } from '@/lib/flags';

export default function PlatformRefactorStatus() {
  const { data: runs = [], isLoading, refetch } = useQuery({
    queryKey: ['refactor-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refactor_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Poll every 10s
  });

  const latestRun = runs[0];
  const allFlags = getAllFlags();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Refactor Status</h1>
          <p className="text-muted-foreground mt-1">
            Monitor smoke test runs and feature flag states
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => alert('Trigger smoke tests via CI (implement webhook)')}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Run Smoke Tests
          </Button>
        </div>
      </div>

      {/* Feature Flags Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(allFlags).map(([flag, enabled]) => (
              <div key={flag} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <span className="text-sm font-mono">{flag}</span>
                <Badge variant={enabled ? 'default' : 'secondary'}>
                  {enabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Flags are configured in .env file. Restart dev server to apply changes.
          </p>
        </CardContent>
      </Card>

      {/* Latest Test Run */}
      {latestRun && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Test Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(latestRun.created_at), 'PPpp')}
                </span>
                <Badge
                  variant={
                    latestRun.status === 'passed' ? 'default' :
                    latestRun.status === 'failed' ? 'destructive' : 'secondary'
                  }
                >
                  {latestRun.status === 'passed' && <CheckCircle className="mr-1 h-3 w-3" />}
                  {latestRun.status === 'failed' && <AlertCircle className="mr-1 h-3 w-3" />}
                  {latestRun.status === 'running' && <Clock className="mr-1 h-3 w-3" />}
                  {latestRun.status.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{latestRun.total_tests}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{latestRun.passed_tests}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{latestRun.failed_tests}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
              {latestRun.duration_ms && (
                <div className="text-sm text-muted-foreground">
                  Duration: {(latestRun.duration_ms / 1000).toFixed(2)}s
                </div>
              )}
              {latestRun.git_branch && (
                <div className="text-sm text-muted-foreground">
                  Branch: <code className="bg-muted px-1 py-0.5 rounded">{latestRun.git_branch}</code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test History */}
      <Card>
        <CardHeader>
          <CardTitle>Test History (Last 20 Runs)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : runs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No test runs yet. Run smoke tests to see results here.
              <div className="mt-4">
                <code className="bg-muted px-2 py-1 rounded text-sm">npm run smoke</code>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map((run: any) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          run.status === 'passed' ? 'default' : 
                          run.status === 'failed' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {run.status}
                      </Badge>
                      <span className="text-sm">
                        {run.passed_tests}/{run.total_tests} passed
                      </span>
                      {run.duration_ms && (
                        <span className="text-xs text-muted-foreground">
                          ({(run.duration_ms / 1000).toFixed(1)}s)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(run.created_at), 'PPp')}
                      {run.git_branch && ` • ${run.git_branch}`}
                      {run.git_commit && ` • ${run.git_commit.substring(0, 7)}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">View Details</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Running Smoke Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <code className="bg-muted px-2 py-1 rounded text-sm">npm run smoke</code>
            <p className="text-sm text-muted-foreground mt-1">Run all smoke tests headless</p>
          </div>
          <div>
            <code className="bg-muted px-2 py-1 rounded text-sm">npm run smoke:headed</code>
            <p className="text-sm text-muted-foreground mt-1">Run with browser visible</p>
          </div>
          <div>
            <code className="bg-muted px-2 py-1 rounded text-sm">npm run smoke:ui</code>
            <p className="text-sm text-muted-foreground mt-1">Interactive test UI</p>
          </div>
          <div>
            <code className="bg-muted px-2 py-1 rounded text-sm">npm run smoke:report</code>
            <p className="text-sm text-muted-foreground mt-1">View last test report</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
