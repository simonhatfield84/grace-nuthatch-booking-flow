import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, RefreshCw, CheckCircle, XCircle, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SquareMappingManager } from './SquareMappingManager';

export function SquareSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [settings, setSettings] = useState<any>(null);
  const [applicationId, setApplicationId] = useState('');
  const [isEditingAppId, setIsEditingAppId] = useState(false);
  
  useEffect(() => {
    loadSettings();
  }, [user]);
  
  useEffect(() => {
    if (settings) {
      const appId = environment === 'sandbox' 
        ? settings.application_id_sandbox 
        : settings.application_id_production;
      setApplicationId(appId || '');
    }
  }, [settings, environment]);
  
  const loadSettings = async () => {
    if (!user?.id) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('venue_id')
      .eq('id', user.id)
      .single();
    
    if (!profile?.venue_id) return;
    
    const { data } = await supabase
      .from('venue_square_settings')
      .select('*')
      .eq('venue_id', profile.venue_id)
      .maybeSingle();
    
    setSettings(data);
  };
  
  const handleSaveAppId = async () => {
    if (!applicationId.trim()) {
      toast.error('Application ID is required');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.venue_id) {
        toast.error('Venue not found');
        return;
      }
      
      const updateField = environment === 'sandbox'
        ? { application_id_sandbox: applicationId }
        : { application_id_production: applicationId };
      
      const { error } = await supabase
        .from('venue_square_settings')
        .upsert({
          venue_id: profile.venue_id,
          ...updateField
        });
      
      if (error) throw error;
      
      toast.success('Application ID saved');
      setIsEditingAppId(false);
      loadSettings();
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save Application ID');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConnect = async () => {
    if (!applicationId.trim()) {
      toast.error('Please configure Application ID first');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.venue_id) {
        toast.error('Venue not found');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('square-oauth-start', {
        body: {
          venue_id: profile.venue_id,
          environment,
          application_id: applicationId
        }
      });
      
      if (error) throw error;
      
      // Redirect to Square OAuth
      window.location.href = data.authorize_url;
      
    } catch (error) {
      console.error('OAuth start error:', error);
      toast.error('Failed to start Square connection');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResync = async () => {
    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();
      
      const { data, error } = await supabase.functions.invoke('square-sync-mappings', {
        body: {
          venue_id: profile?.venue_id,
          environment
        }
      });
      
      if (error) throw error;
      
      toast.success(`Synced ${data.locations_synced} locations and ${data.devices_synced} devices`);
      loadSettings();
      
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync Square data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const isConnected = settings?.configuration_status?.[environment]?.oauth_connected;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Square POS Integration
          </CardTitle>
          <CardDescription>
            Connect your Square account to automatically link orders to bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Toggle */}
          <div className="space-y-2">
            <Label>Environment</Label>
            <Tabs value={environment} onValueChange={(v) => setEnvironment(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sandbox">Sandbox (Testing)</TabsTrigger>
                <TabsTrigger value="production">Production (Live)</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground">
              Use Sandbox for testing, Production for live transactions
            </p>
          </div>
          
          {/* Application ID Configuration */}
          <div className="space-y-2">
            <Label htmlFor="app-id">Square Application ID</Label>
            {isEditingAppId || !applicationId ? (
              <div className="flex gap-2">
                <Input
                  id="app-id"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="sq0idp-..."
                />
                <Button onClick={handleSaveAppId} disabled={isLoading}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={applicationId}
                  disabled
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditingAppId(true)}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Get this from your Square Developer Dashboard
            </p>
          </div>
          
          {/* Connection Status */}
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>
                {isConnected ? 'Connected to Square' : 'Not connected'}
              </span>
              {isConnected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
            </AlertDescription>
          </Alert>
          
          {/* OAuth Button */}
          {!isConnected ? (
            <Button 
              onClick={handleConnect}
              disabled={isLoading || !applicationId}
              className="w-full"
            >
              {isLoading ? 'Connecting...' : 'Connect Square Account'}
            </Button>
          ) : (
            <Button 
              onClick={handleResync}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Syncing...' : 'Re-sync Locations & Devices'}
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Mapping Management */}
      {isConnected && (
        <SquareMappingManager environment={environment} />
      )}
    </div>
  );
}
