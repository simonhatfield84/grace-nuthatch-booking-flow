import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const fetchServicesSchema = z.object({
  venueSlug: z.string(),
  partySize: z.number().int().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const corsH = getCorsHeaders(req);

  try {
    const body = await req.json();
    const input = fetchServicesSchema.parse(body);

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
      return new Response(JSON.stringify({
        ok: false,
        code: 'venue_not_found',
      }), {
        status: 404,
        headers: { ...corsH, 'Content-Type': 'application/json' }
      });
    }

    // Get day of week
    const dayOfWeek = new Date(input.date).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

    // Get services that match party size and are available on this day
    const { data: services } = await supabase
      .from('services')
      .select(`
        id, title, description, image_url, requires_payment,
        min_guests, max_guests, duration_rules,
        booking_windows!inner (
          days, start_time, end_time, blackout_periods
        )
      `)
      .eq('venue_id', venue.id)
      .eq('online_bookable', true)
      .eq('active', true)
      .lte('min_guests', input.partySize)
      .gte('max_guests', input.partySize);

    if (!services) {
      return new Response(JSON.stringify({
        ok: true,
        services: [],
      }), {
        status: 200,
        headers: { ...corsH, 'Content-Type': 'application/json' }
      });
    }

    // Filter services that have windows for this day
    const availableServices = services.filter((service: any) => {
      const windows = Array.isArray(service.booking_windows) ? service.booking_windows : [service.booking_windows];
      
      return windows.some((window: any) => {
        if (!window.days || !window.days.includes(dayOfWeek)) {
          return false;
        }

        // Check blackout periods
        const blackoutPeriods = window.blackout_periods || [];
        const isBlackedOut = blackoutPeriods.some((period: any) => {
          if (period.startDate && period.endDate) {
            return input.date >= period.startDate && input.date <= period.endDate;
          }
          return false;
        });

        return !isBlackedOut;
      });
    });

    // Clean up the response
    const cleanedServices = availableServices.map((service: any) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      image_url: service.image_url,
      requires_payment: service.requires_payment,
      min_guests: service.min_guests,
      max_guests: service.max_guests,
      duration_rules: service.duration_rules,
    }));

    return new Response(JSON.stringify({
      ok: true,
      services: cleanedServices,
    }), {
      status: 200,
      headers: { ...corsH, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Fetch services error:', error);
    return new Response(JSON.stringify({
      ok: false,
      code: 'internal_error',
      message: error.message,
    }), {
      status: 500,
      headers: { ...corsH, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
