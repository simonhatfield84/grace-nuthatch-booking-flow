import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

interface TestResult {
  venueId: string | null;
  venueName: string | null;
  areaId: number | null;
  areaName: string | null;
  tableId: number | null;
  tableLabel: string | null;
  method: string;
}

export function MappingTester() {
  const [locationId, setLocationId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [tableName, setTableName] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testMapping = async () => {
    if (!locationId) {
      toast.error('Location ID is required');
      return;
    }

    setIsTesting(true);
    try {
      // Step 1: Resolve venue from location
      const { data: venueData, error: venueError } = await supabase
        .from('square_location_map')
        .select('grace_venue_id, venues(name)')
        .eq('square_location_id', locationId)
        .single();

      if (venueError && venueError.code !== 'PGRST116') {
        throw venueError;
      }

      const venueId = venueData?.grace_venue_id || null;
      const venueName = venueData?.venues?.name || null;

      // Step 2: Try to resolve via table name first (highest priority)
      if (tableName) {
        const { data: tableData, error: tableError } = await supabase
          .from('square_table_map')
          .select('grace_table_id, tables(id, label, section_id, sections(name))')
          .eq('square_location_id', locationId)
          .eq('square_table_name', tableName)
          .single();

        if (!tableError && tableData) {
          setResult({
            venueId,
            venueName,
            areaId: tableData.tables?.section_id || null,
            areaName: tableData.tables?.sections?.name || null,
            tableId: tableData.grace_table_id,
            tableLabel: tableData.tables?.label || null,
            method: 'table_name_mapping'
          });
          setIsTesting(false);
          return;
        }
      }

      // Step 3: Fall back to device mapping
      let query = supabase
        .from('square_device_map')
        .select('grace_area_id, grace_table_id, sections(name), tables(label)')
        .eq('square_location_id', locationId);

      if (deviceId) {
        query = query.eq('square_device_id', deviceId);
      } else if (sourceName) {
        query = query.eq('square_source_name', sourceName);
      }

      const { data: deviceData, error: deviceError } = await query.single();

      if (deviceError && deviceError.code !== 'PGRST116') {
        throw deviceError;
      }

      setResult({
        venueId,
        venueName,
        areaId: deviceData?.grace_area_id || null,
        areaName: deviceData?.sections?.name || null,
        tableId: deviceData?.grace_table_id || null,
        tableLabel: deviceData?.tables?.label || null,
        method: deviceData ? 'device_mapping' : 'no_mapping_found'
      });

    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to test mapping');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location-id">Location ID *</Label>
          <Input
            id="location-id"
            placeholder="e.g., L123ABC"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="device-id">Device ID (optional)</Label>
          <Input
            id="device-id"
            placeholder="e.g., device_123"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source-name">Source Name (optional)</Label>
          <Input
            id="source-name"
            placeholder="e.g., Register 1"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="table-name">Square Table Name (optional)</Label>
          <Input
            id="table-name"
            placeholder="e.g., Table 4"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={testMapping} disabled={isTesting || !locationId} className="w-full">
        {isTesting ? 'Testing...' : 'Test Mapping'}
      </Button>

      {result && (
        <Alert className={result.method === 'no_mapping_found' ? 'border-amber-500 bg-amber-50' : 'border-green-600 bg-green-50'}>
          <AlertDescription className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              {result.method !== 'no_mapping_found' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Mapping Resolved
                </>
              ) : (
                <>
                  ⚠️ No Mapping Found
                </>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Venue:</span>
                <span className="font-mono">
                  {result.venueName || <span className="text-amber-600">Not mapped</span>}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Area:</span>
                <span className="font-mono">
                  {result.areaName || <span className="text-amber-600">Not mapped</span>}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Table:</span>
                <span className="font-mono">
                  {result.tableLabel || <span className="text-amber-600">Not mapped</span>}
                </span>
              </div>

              <div className="flex items-center justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">Resolution Method:</span>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                  result.method === 'table_name_mapping' 
                    ? 'bg-green-100 text-green-800' 
                    : result.method === 'device_mapping'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {result.method === 'table_name_mapping' && '🎯 Table Name (Priority)'}
                  {result.method === 'device_mapping' && '📱 Device Mapping'}
                  {result.method === 'no_mapping_found' && '❌ No Mapping'}
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
