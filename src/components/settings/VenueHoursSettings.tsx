
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const VenueHoursSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("23:00");

  // Get user's venue ID
  const { data: userVenue } = useQuery({
    queryKey: ['user-venue', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.venue_id;
    },
    enabled: !!user,
  });

  // Fetch current venue hours
  const { data: venueHours, isLoading } = useQuery({
    queryKey: ['venue-hours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_settings')
        .select('setting_value')
        .eq('setting_key', 'operating_hours')
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value as { start_time: string; end_time: string } | null;
    }
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (venueHours) {
      setStartTime(venueHours.start_time);
      setEndTime(venueHours.end_time);
    }
  }, [venueHours]);

  // Update venue hours mutation
  const updateHoursMutation = useMutation({
    mutationFn: async ({ start_time, end_time }: { start_time: string; end_time: string }) => {
      if (!userVenue) {
        throw new Error('No venue associated with user');
      }

      const { data, error } = await supabase
        .from('venue_settings')
        .upsert({
          setting_key: 'operating_hours',
          setting_value: { start_time, end_time },
          venue_id: userVenue
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-hours'] });
      toast({
        title: "Hours updated",
        description: "Venue operating hours have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update venue hours. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (startTime >= endTime) {
      toast({
        title: "Invalid hours",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }
    
    updateHoursMutation.mutate({ start_time: startTime, end_time: endTime });
  };

  if (isLoading) {
    return <div>Loading venue hours...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Venue Operating Hours</CardTitle>
        <CardDescription>
          Set your venue's operating hours. These times will be used for booking availability and the host interface grid.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Opening Time</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Closing Time</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={updateHoursMutation.isPending || !userVenue}
        >
          {updateHoursMutation.isPending ? "Saving..." : "Save Operating Hours"}
        </Button>
      </CardContent>
    </Card>
  );
};
