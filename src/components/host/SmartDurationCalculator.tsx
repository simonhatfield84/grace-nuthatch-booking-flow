
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface SmartDurationCalculatorProps {
  duration: number;
  setDuration: (duration: number) => void;
  time: string;
  selectedDate: Date;
  tableId: number;
  partySize: number;
}

export const SmartDurationCalculator = ({
  duration,
  setDuration,
  time,
  selectedDate,
  tableId,
  partySize
}: SmartDurationCalculatorProps) => {
  const [defaultDuration, setDefaultDuration] = useState(120);
  const [nextBooking, setNextBooking] = useState<{ time: string; guest: string } | null>(null);
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { user } = useAuth();

  // Load venue default duration
  useEffect(() => {
    const loadVenueDefaults = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();

        if (profile?.venue_id) {
          const { data: walkInSettings } = await supabase
            .from('venue_settings')
            .select('setting_value')
            .eq('venue_id', profile.venue_id)
            .eq('setting_key', 'walk_in_duration')
            .maybeSingle();

          const venueDuration = walkInSettings?.setting_value as number || 120;
          setDefaultDuration(venueDuration);
          
          // Set initial duration if not already set
          if (duration === 120) {
            setDuration(venueDuration);
          }
        }
      } catch (error) {
        console.error('Error loading venue defaults:', error);
      }
    };

    loadVenueDefaults();
  }, [user, duration, setDuration]);

  // Calculate maximum duration based on next booking
  useEffect(() => {
    const calculateMaxDuration = async () => {
      if (!user || !time || !tableId) return;

      setIsCalculating(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('venue_id')
          .eq('id', user.id)
          .single();

        if (profile?.venue_id) {
          const { data: nextBookings } = await supabase
            .from('bookings')
            .select('booking_time, guest_name, duration_minutes')
            .eq('venue_id', profile.venue_id)
            .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
            .eq('table_id', tableId)
            .gte('booking_time', time)
            .neq('status', 'cancelled')
            .order('booking_time', { ascending: true })
            .limit(1);

          if (nextBookings && nextBookings.length > 0) {
            const next = nextBookings[0];
            const currentTime = new Date(`2000-01-01 ${time}`);
            const nextTime = new Date(`2000-01-01 ${next.booking_time}`);
            const timeDiff = (nextTime.getTime() - currentTime.getTime()) / (1000 * 60);
            
            setNextBooking({
              time: next.booking_time,
              guest: next.guest_name
            });
            setMaxDuration(timeDiff);
            
            // Auto-adjust duration if it exceeds available time
            if (duration > timeDiff) {
              setDuration(Math.max(30, timeDiff));
            }
          } else {
            setNextBooking(null);
            setMaxDuration(null);
          }
        }
      } catch (error) {
        console.error('Error calculating max duration:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateMaxDuration();
  }, [user, time, selectedDate, tableId, duration, setDuration]);

  const calculateEndTime = () => {
    if (!time) return null;
    
    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + (duration * 60 * 1000));
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleDurationChange = (newDuration: number) => {
    if (maxDuration && newDuration > maxDuration) {
      setDuration(maxDuration);
    } else {
      setDuration(Math.max(30, newDuration));
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="duration" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Duration (minutes)
        </Label>
        <div className="flex items-center gap-2 mt-1">
          <Input
            id="duration"
            type="number"
            min="30"
            max={maxDuration || 360}
            step="15"
            value={duration}
            onChange={(e) => handleDurationChange(parseInt(e.target.value) || defaultDuration)}
            className="text-foreground bg-background border-border"
          />
          <span className="text-sm text-muted-foreground">
            Until {calculateEndTime()}
          </span>
        </div>
      </div>

      {isCalculating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-spin" />
          Calculating available time...
        </div>
      )}

      {nextBooking && (
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-muted-foreground">
            Next booking: <strong>{nextBooking.guest}</strong> at {nextBooking.time}
          </span>
        </div>
      )}

      {duration !== defaultDuration && (
        <Badge variant="outline" className="text-xs">
          {duration > defaultDuration ? 'Extended' : 'Shortened'} from venue default ({defaultDuration}min)
        </Badge>
      )}
      
      {maxDuration && duration >= maxDuration && (
        <Badge variant="destructive" className="text-xs">
          Maximum duration reached
        </Badge>
      )}
    </div>
  );
};
