import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { findAvailableTable, addMinutesToTime } from '../_shared/tableAllocation.ts';
import { startOfMonth, endOfMonth, eachDayOfInterval, format as formatDate } from "https://esm.sh/date-fns@3.6.0";
import { initSentry, withSentry } from '../_shared/sentry.ts';

// Initialize Sentry
initSentry();

const checkAvailabilitySchema = z.object({
  venueSlug: z.string(),
  serviceId: z.string().uuid(),
  partySize: z.number().int().min(1).max(50),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
});

function getDurationForPartySize(durationRules: any, partySize: number): number {
  const DEFAULT_DURATION = 120;
  
  if (!Array.isArray(durationRules) || durationRules.length === 0) {
    return DEFAULT_DURATION;
  }
  
  const matchingRule = durationRules.find((rule: any) => 
    partySize >= (rule.minGuests || 0) && 
    partySize <= (rule.maxGuests || 999)
  );
  
  return matchingRule?.durationMinutes || DEFAULT_DURATION;
}

function generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number, durationMinutes: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  for (let minutes = startMinutes; minutes <= endMinutes - durationMinutes; minutes += intervalMinutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
  }
  
  return slots;
}

const handler = withSentry(async (req, transaction, reqId) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const corsH = getCorsHeaders(req);

  try {
    const body = await req.json();
    const input = checkAvailabilitySchema.parse(body);
    
    // Add Sentry tags
    transaction.setTag('venueSlug', input.venueSlug);
    transaction.setTag('serviceId', input.serviceId);
    transaction.setTag('partySize', input.partySize);
    transaction.setTag('mode', input.month ? 'calendar' : 'slots');

    // Database span
    const dbSpan = transaction.startChild({
      op: 'db.query',
      description: 'Fetch venue and service',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Resolve venue
    const { data: venue } = await supabase
      .from('venues')
      .select('id')
      .eq('slug', input.venueSlug)
      .single();

    if (!venue) {
      dbSpan.finish();
      return new Response(JSON.stringify({
        ok: false,
        code: 'venue_not_found',
      }), {
        status: 404,
        headers: { ...corsH, 'Content-Type': 'application/json' }
      });
    }

    // Get service with booking windows
    const { data: service } = await supabase
      .from('services')
      .select('id, title, min_guests, max_guests, duration_rules')
      .eq('id', input.serviceId)
      .eq('venue_id', venue.id)
      .single();

    if (!service) {
      dbSpan.finish();
      return new Response(JSON.stringify({
        ok: false,
        code: 'service_not_found',
      }), {
        status: 404,
        headers: { ...corsH, 'Content-Type': 'application/json' }
      });
    }

    // Get booking windows for this service
    const { data: windows } = await supabase
      .from('booking_windows')
      .select('*')
      .eq('service_id', service.id)
      .eq('venue_id', venue.id);

    dbSpan.finish();

    if (!windows || windows.length === 0) {
      return new Response(JSON.stringify({
        ok: true,
        availability: {},
        duration: getDurationForPartySize(service.duration_rules, input.partySize),
      }), {
        status: 200,
        headers: { ...corsH, 'Content-Type': 'application/json' }
      });
    }

    const duration = getDurationForPartySize(service.duration_rules, input.partySize);

    // Generate date range
    let dates: string[];
    if (input.month) {
      const [year, month] = input.month.split('-').map(Number);
      const monthDate = new Date(year, month - 1, 1);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const daysInMonth = eachDayOfInterval({ start, end });
      dates = daysInMonth.map(d => formatDate(d, 'yyyy-MM-dd'));
    } else if (input.date) {
      dates = [input.date];
    } else {
      return new Response(JSON.stringify({
        ok: false,
        code: 'invalid_request',
        message: 'Either month or date must be provided',
      }), {
        status: 400,
        headers: { ...corsH, 'Content-Type': 'application/json' }
      });
    }

    // Availability check span
    const availSpan = transaction.startChild({
      op: 'availability.check',
      description: 'Check table availability',
    });

    const availabilityMap: Record<string, string[]> = {};

    // Check each date
    for (const date of dates) {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      
      // Find matching window
      const matchingWindow = windows.find((w: any) => 
        w.days && w.days.includes(dayOfWeek)
      );

      if (!matchingWindow) {
        availabilityMap[date] = [];
        continue;
      }

      // Check blackout periods
      const blackoutPeriods = matchingWindow.blackout_periods || [];
      const isBlackedOut = blackoutPeriods.some((period: any) => {
        if (period.startDate && period.endDate) {
          return date >= period.startDate && date <= period.endDate;
        }
        return false;
      });

      if (isBlackedOut) {
        availabilityMap[date] = [];
        continue;
      }

      // Generate time slots
      const slots = generateTimeSlots(
        matchingWindow.start_time,
        matchingWindow.end_time,
        15,
        duration
      );

      const availableSlots: string[] = [];
      
      for (const time of slots) {
        const result = await findAvailableTable(supabase, {
          venueId: venue.id,
          date,
          time,
          partySize: input.partySize,
          duration,
        });

        if (result.available) {
          availableSlots.push(time);
        }
      }

      availabilityMap[date] = availableSlots;
    }

    availSpan.finish();

    return new Response(JSON.stringify({
      ok: true,
      availability: availabilityMap,
      duration,
    }), {
      status: 200,
      headers: { ...corsH, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Check availability error:', error);
    return new Response(JSON.stringify({
      ok: false,
      code: 'internal_error',
      message: error.message,
    }), {
      status: 500,
      headers: { ...corsH, 'Content-Type': 'application/json' }
    });
  }
}, 'POST /check-availability');

serve(handler);
