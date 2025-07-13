
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const VenueHoursSettings = () => {
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("23:00");
  const [walkInDuration, setWalkInDuration] = useState(120);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user's venue ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();

      if (profile?.venue_id) {
        // Load operating hours
        const { data: hoursData } = await supabase
          .from('venue_settings')
          .select('setting_value')
          .eq('venue_id', profile.venue_id)
          .eq('setting_key', 'operating_hours')
          .maybeSingle();

        if (hoursData?.setting_value) {
          const hours = hoursData.setting_value as any;
          setStartTime(hours.start_time || "17:00");
          setEndTime(hours.end_time || "23:00");
        }

        // Load walk-in duration
        const { data: walkInData } = await supabase
          .from('venue_settings')
          .select('setting_value')
          .eq('venue_id', profile.venue_id)
          .eq('setting_key', 'walk_in_duration')
          .maybeSingle();

        if (walkInData?.setting_value) {
          setWalkInDuration(walkInData.setting_value as number);
        }
      }
    } catch (error) {
      console.error('Error loading venue settings:', error);
      toast({
        title: "Error",
        description: "Failed to load venue settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Get user's venue ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();

      if (!profile?.venue_id) {
        throw new Error('No venue associated with user');
      }

      // Save operating hours
      const { error: hoursError } = await supabase
        .from('venue_settings')
        .upsert({
          venue_id: profile.venue_id,
          setting_key: 'operating_hours',
          setting_value: {
            start_time: startTime,
            end_time: endTime
          }
        }, {
          onConflict: 'venue_id,setting_key'
        });

      if (hoursError) throw hoursError;

      // Save walk-in duration
      const { error: walkInError } = await supabase
        .from('venue_settings')
        .upsert({
          venue_id: profile.venue_id,
          setting_key: 'walk_in_duration',
          setting_value: walkInDuration
        }, {
          onConflict: 'venue_id,setting_key'
        });

      if (walkInError) throw walkInError;

      toast({
        title: "Settings saved",
        description: "Venue hours and walk-in duration have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error saving venue settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save venue settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Venue Hours & Walk-In Settings
        </CardTitle>
        <CardDescription>
          Set your venue's operating hours and default walk-in duration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Opening Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Closing Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="walkInDuration">Default Walk-In Duration (minutes)</Label>
          <Input
            id="walkInDuration"
            type="number"
            min="30"
            max="360"
            step="15"
            value={walkInDuration}
            onChange={(e) => setWalkInDuration(Math.max(30, parseInt(e.target.value) || 120))}
            placeholder="120"
          />
          <p className="text-sm text-muted-foreground">
            How long walk-in customers are seated by default (can be adjusted per booking)
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
