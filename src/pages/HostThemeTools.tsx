
// Host-only theme — do not import outside /host routes

import React, { useState, useEffect } from 'react';
import { HostLayout } from '@/components/layouts/HostLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { HOST_TOKENS } from '@/theme/host-tokens';
import { RefreshCw, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';

interface ThemeSnapshot {
  timestamp: string;
  version: string;
  tokens: typeof HOST_TOKENS;
  cssVariables: Record<string, string>;
}

export default function HostThemeTools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<ThemeSnapshot[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<ThemeSnapshot | null>(null);
  const [diffText, setDiffText] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin (basic check - enhance based on your auth system)
  const isAdmin = user?.email?.includes('admin') || user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    loadSnapshots();
  }, [isAdmin]);

  const loadSnapshots = async () => {
    try {
      setIsLoading(true);
      // Load snapshots from public directory
      const response = await fetch('/theme-snapshots/index.json');
      if (response.ok) {
        const snapshotList = await response.json();
        const loadedSnapshots = await Promise.all(
          snapshotList.map(async (filename: string) => {
            const snapshotResponse = await fetch(`/theme-snapshots/${filename}`);
            return await snapshotResponse.json();
          })
        );
        setSnapshots(loadedSnapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        
        if (loadedSnapshots.length > 0) {
          const latest = loadedSnapshots[0];
          setCurrentSnapshot(latest);
          generateDiff(latest);
        }
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error);
      toast({
        title: "Failed to load snapshots",
        description: "Could not load theme snapshots. Check if snapshots exist.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateDiff = (snapshot: ThemeSnapshot) => {
    const currentTokens = JSON.stringify(HOST_TOKENS, null, 2);
    const snapshotTokens = JSON.stringify(snapshot.tokens, null, 2);
    
    if (currentTokens === snapshotTokens) {
      setDiffText('✅ Current tokens match snapshot - no changes detected.');
    } else {
      setDiffText(`🔄 Changes detected:\n\nCurrent:\n${currentTokens}\n\nSnapshot:\n${snapshotTokens}`);
    }
  };

  const resetToSnapshot = async (snapshot: ThemeSnapshot) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can reset themes.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      // In a real implementation, this would call an API endpoint to overwrite the theme files
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Theme Reset Successful",
        description: `Theme has been reset to snapshot from ${new Date(snapshot.timestamp).toLocaleDateString()}`,
      });
      
      // Reload page to see changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset theme:', error);
      toast({
        title: "Reset Failed",
        description: "Could not reset theme. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const createManualSnapshot = async () => {
    if (!isAdmin) return;
    
    try {
      const snapshot: ThemeSnapshot = {
        timestamp: new Date().toISOString(),
        version: `manual-${Date.now()}`,
        tokens: HOST_TOKENS,
        cssVariables: {} // Would be populated with actual CSS variables in real implementation
      };

      // In real implementation, would save to server
      toast({
        title: "Snapshot Created",
        description: "Manual theme snapshot has been created successfully.",
      });
      
      setSnapshots(prev => [snapshot, ...prev]);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      toast({
        title: "Snapshot Failed",
        description: "Could not create manual snapshot.",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <HostLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md host-border">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="host-text">
              Access denied. This tool is only available to administrators.
            </AlertDescription>
          </Alert>
        </div>
      </HostLayout>
    );
  }

  if (isLoading) {
    return (
      <HostLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin host-muted" />
        </div>
      </HostLayout>
    );
  }

  return (
    <HostLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold host-text">Host Theme Tools</h1>
            <p className="host-muted">Manage Host interface theme snapshots and resets</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={createManualSnapshot} 
              variant="outline" 
              className="host-border host-text"
            >
              <Download className="h-4 w-4 mr-2" />
              Create Snapshot
            </Button>
            <Button 
              onClick={loadSnapshots}
              variant="outline" 
              className="host-border host-text"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Status */}
        <Card className="host-card host-border">
          <CardHeader>
            <CardTitle className="host-text flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Theme Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="host-muted text-sm">Current Version</p>
                <p className="host-text font-mono">build-{Date.now().toString().slice(-8)}</p>
              </div>
              <div>
                <p className="host-muted text-sm">Last Snapshot</p>
                <p className="host-text font-mono">
                  {currentSnapshot ? new Date(currentSnapshot.timestamp).toLocaleDateString() : 'None'}
                </p>
              </div>
              <div>
                <p className="host-muted text-sm">Status</p>
                <Badge variant="secondary" className="bg-green-900/20 text-green-400 border-green-400/20">
                  Stable
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Snapshots List */}
        <Card className="host-card host-border">
          <CardHeader>
            <CardTitle className="host-text">Available Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshots.length === 0 ? (
              <p className="host-muted text-center py-4">No snapshots available</p>
            ) : (
              <div className="space-y-3">
                {snapshots.slice(0, 5).map((snapshot, index) => (
                  <div key={snapshot.timestamp} className="flex items-center justify-between p-3 host-card rounded-lg host-border">
                    <div>
                      <p className="host-text font-medium">{snapshot.version}</p>
                      <p className="host-muted text-sm">{new Date(snapshot.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {index === 0 && (
                        <Badge variant="secondary" className="bg-blue-900/20 text-blue-400 border-blue-400/20">
                          Latest
                        </Badge>
                      )}
                      <Button
                        onClick={() => resetToSnapshot(snapshot)}
                        disabled={isResetting}
                        size="sm"
                        variant="outline"
                        className="host-border host-text"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diff Viewer */}
        {currentSnapshot && (
          <Card className="host-card host-border">
            <CardHeader>
              <CardTitle className="host-text">Current vs Latest Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={diffText}
                readOnly
                className="min-h-[200px] font-mono text-xs host-border host-text"
                style={{ backgroundColor: HOST_TOKENS.colors.surface }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </HostLayout>
  );
}
