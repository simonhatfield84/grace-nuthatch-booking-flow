import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TestTube2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LocationMappingGrid } from "@/components/admin/square-mapping/LocationMappingGrid";
import { DeviceMappingGrid } from "@/components/admin/square-mapping/DeviceMappingGrid";
import { TableMappingGrid } from "@/components/admin/square-mapping/TableMappingGrid";
import { MappingTester } from "@/components/admin/square-mapping/MappingTester";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SquareManualMapping() {
  const [isFetching, setIsFetching] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFetchFromSquare = async () => {
    setIsFetching(true);
    try {
      // Fetch locations
      const { data: locData, error: locError } = await supabase.functions.invoke('square-fetch-locations');
      
      if (locError) throw locError;
      
      if (locData?.error) {
        throw new Error(locData.error);
      }

      // Fetch devices
      const { data: devData, error: devError } = await supabase.functions.invoke('square-fetch-devices');
      
      if (devError) throw devError;
      
      if (devData?.error) {
        throw new Error(devData.error);
      }

      console.log('Fetched data:', { locations: locData?.locations?.length, devices: devData?.devices?.length });

      // Upsert locations (don't overwrite grace_venue_id if already set)
      if (locData?.locations) {
        for (const loc of locData.locations) {
          const { error } = await supabase
            .from('square_location_map')
            .upsert(
              [{ square_location_id: loc.id, grace_venue_id: null }],
              { onConflict: 'square_location_id', ignoreDuplicates: false }
            );
          
          if (error) {
            console.error('Error upserting location:', loc.id, error);
          }
        }
      }

      // Upsert devices (don't overwrite grace mappings if already set)
      if (devData?.devices) {
        for (const dev of devData.devices) {
          // Check if device already exists
          const { data: existing } = await supabase
            .from('square_device_map')
            .select('*')
            .eq('square_device_id', dev.id)
            .single();

          if (existing) {
            // Update only Square fields, keep Grace mappings
            const { error } = await supabase
              .from('square_device_map')
              .update({
                square_location_id: dev.location_id,
                square_source_name: dev.name
              })
              .eq('square_device_id', dev.id);
            
            if (error) {
              console.error('Error updating device:', dev.id, error);
            }
          } else {
            // Insert new device
            const { error } = await supabase
              .from('square_device_map')
              .insert({
                square_location_id: dev.location_id,
                square_device_id: dev.id,
                square_source_name: dev.name
              });
            
            if (error) {
              console.error('Error inserting device:', dev.id, error);
            }
          }
        }
      }

      toast.success(`Fetched ${locData?.locations?.length || 0} locations and ${devData?.devices?.length || 0} devices from Square`);
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error.message || 'Failed to fetch from Square');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Square → Grace Mappings</h1>
        <p className="text-muted-foreground mt-2">
          Configure manual mappings between Square and Grace without OAuth
        </p>
      </div>

      {/* Fetch Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Fetch from Square
          </CardTitle>
          <CardDescription>
            Pre-fill mappings from your Square account using SQUARE_MERCHANT_ACCESS_TOKEN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              This will fetch locations and devices from Square and pre-fill the grids below.
              Existing Grace assignments will NOT be overwritten.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={handleFetchFromSquare} 
            disabled={isFetching}
            className="w-full sm:w-auto"
          >
            {isFetching ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Fetching...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Fetch from Square
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Location Mappings */}
      <LocationMappingGrid refreshTrigger={refreshTrigger} />

      {/* Device Mappings */}
      <DeviceMappingGrid refreshTrigger={refreshTrigger} />

      {/* Table Mappings */}
      <TableMappingGrid refreshTrigger={refreshTrigger} />

      {/* Mapping Tester */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Mapping Tester
          </CardTitle>
          <CardDescription>
            Test how Square data resolves to Grace venues, areas, and tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MappingTester />
        </CardContent>
      </Card>
    </div>
  );
}

