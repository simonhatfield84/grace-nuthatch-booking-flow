import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createErrorResponse } from '../_shared/errorSanitizer.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Exponential backoff schedule (seconds)
const BACKOFF_SCHEDULE = [10, 30, 60, 120, 300, 600, 1200, 3600];

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Dequeue items due for processing
    const { data: queueItems, error: dequeueError } = await supabase
      .from('square_event_queue')
      .select('*')
      .lte('next_attempt_at', new Date().toISOString())
      .lt('attempts', 8)
      .order('next_attempt_at', { ascending: true })
      .limit(10);

    if (dequeueError) throw dequeueError;

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const queueItem of queueItems) {
      try {
        // Fetch webhook event
        const { data: webhookEvent, error: fetchError } = await supabase
          .from('square_webhook_events')
          .select('*')
          .eq('id', queueItem.webhook_event_id)
          .single();

        if (fetchError || !webhookEvent) {
          console.error('Failed to fetch webhook event:', fetchError);
          continue;
        }

        // Process based on event type
        if (webhookEvent.event_type === 'order.updated') {
          await processOrderUpdated(supabase, webhookEvent);
        }

        // Mark as processed
        await supabase
          .from('square_webhook_events')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('id', webhookEvent.id);

        // Remove from queue
        await supabase
          .from('square_event_queue')
          .delete()
          .eq('id', queueItem.id);

        processed++;

      } catch (error) {
        console.error(`Failed to process queue item ${queueItem.id}:`, error);
        failed++;

        // Update retry backoff
        const nextAttempt = queueItem.attempts + 1;
        const backoffSeconds = BACKOFF_SCHEDULE[Math.min(nextAttempt - 1, BACKOFF_SCHEDULE.length - 1)];
        const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

        if (nextAttempt >= 8) {
          // Max retries reached
          await supabase
            .from('square_webhook_events')
            .update({ status: 'failed', error: String(error) })
            .eq('id', queueItem.webhook_event_id);

          await supabase
            .from('square_event_queue')
            .delete()
            .eq('id', queueItem.id);

          // Create review for failed event
          const { data: webhookEvent } = await supabase
            .from('square_webhook_events')
            .select('*')
            .eq('id', queueItem.webhook_event_id)
            .single();

          if (webhookEvent) {
            await supabase
              .from('order_link_reviews')
              .insert({
                order_id: webhookEvent.resource_id,
                reason: 'processing_failed',
                confidence: 0.0,
                snapshot: webhookEvent.payload,
                status: 'open'
              });
          }
        } else {
          // Schedule retry
          await supabase
            .from('square_event_queue')
            .update({
              attempts: nextAttempt,
              next_attempt_at: nextAttemptAt,
              last_error: String(error)
            })
            .eq('id', queueItem.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed, failed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Queue worker error:', error);
    return createErrorResponse(error, 500);
  }
});

// Helper: Resolve venue from Square location
async function resolveVenue(supabase: any, locationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('square_location_map')
    .select('grace_venue_id')
    .eq('square_location_id', locationId)
    .maybeSingle();
  
  if (error) {
    console.error('Failed to resolve venue:', error);
    return null;
  }
  
  return data?.grace_venue_id || null;
}

// Helper: Resolve seating assignment
async function resolveSeating(
  supabase: any, 
  venueId: string,
  locationId: string, 
  deviceId: string | null, 
  sourceName: string | null
): Promise<{ areaId: number | null; tableId: number | null }> {
  // 1. Try device map lookup
  const deviceQuery = supabase
    .from('square_device_map')
    .select('grace_area_id, grace_table_id')
    .eq('square_location_id', locationId);
  
  if (deviceId) {
    deviceQuery.eq('square_device_id', deviceId);
  } else if (sourceName) {
    deviceQuery.eq('square_source_name', sourceName);
  } else {
    return { areaId: null, tableId: null };
  }
  
  const { data: deviceMap } = await deviceQuery.maybeSingle();
  
  if (deviceMap) {
    return {
      areaId: deviceMap.grace_area_id,
      tableId: deviceMap.grace_table_id
    };
  }
  
  // 2. Fallback to seating policy
  const { data: policy } = await supabase
    .from('square_seating_policy')
    .select('policy, default_area_id, default_table_id')
    .eq('grace_venue_id', venueId)
    .maybeSingle();
  
  if (!policy) {
    return { areaId: null, tableId: null };
  }
  
  switch (policy.policy) {
    case 'default_table':
      return { areaId: null, tableId: policy.default_table_id };
    case 'least_loaded_in_area':
      return { areaId: policy.default_area_id, tableId: null };
    case 'unassigned':
    default:
      return { areaId: null, tableId: null };
  }
}

// Helper: Find or create guest by Square customer ID
async function findOrCreateGuestBySquareCustomer(
  supabase: any,
  venueId: string,
  customerId: string
): Promise<string | null> {
  // Try to find existing guest
  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('venue_id', venueId)
    .eq('square_customer_id', customerId)
    .maybeSingle();
  
  if (existingGuest) {
    return existingGuest.id;
  }
  
  // Create new guest
  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      venue_id: venueId,
      name: 'Square Customer',
      square_customer_id: customerId,
      square_customer_raw: null,
      opt_in_marketing: false
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create guest:', error);
    return null;
  }
  
  return newGuest.id;
}

// Helper: Fetch complete order data from Square API
async function fetchOrderFromSquareAPI(
  supabase: any,
  orderId: string,
  locationId: string
): Promise<any> {
  // 1. Resolve venue from location
  const { data: locationMap } = await supabase
    .from('square_location_map')
    .select('grace_venue_id')
    .eq('square_location_id', locationId)
    .maybeSingle();
  
  if (!locationMap?.grace_venue_id) {
    throw new Error(`No venue mapping for location ${locationId}`);
  }
  
  // 2. Get venue Square settings
  const { data: settings } = await supabase
    .from('venue_square_settings')
    .select('*')
    .eq('venue_id', locationMap.grace_venue_id)
    .single();
  
  if (!settings) {
    throw new Error('Square settings not found for venue');
  }
  
  // 3. Determine environment and decrypt token
  const environment = settings.environment || 'sandbox';
  const encryptedTokenField = environment === 'sandbox'
    ? settings.access_token_sandbox_encrypted
    : settings.access_token_production_encrypted;
  
  if (!encryptedTokenField) {
    throw new Error(`No access token for ${environment} environment`);
  }
  
  // Import encryption utility
  const { SquareTokenEncryption } = await import('../_shared/squareEncryption.ts');
  
  const accessToken = await SquareTokenEncryption.decryptToken(
    JSON.parse(encryptedTokenField),
    locationMap.grace_venue_id,
    environment
  );
  
  // 4. Call Square Orders API
  const apiBase = environment === 'sandbox'
    ? 'https://connect.squareupsandbox.com/v2'
    : 'https://connect.squareup.com/v2';
  
  const response = await fetch(`${apiBase}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Square-Version': '2024-10-17',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Square API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.order; // Returns full order object
}

async function processOrderUpdated(supabase: any, webhookEvent: any) {
  // Step 1: Extract minimal order info from webhook
  const webhookOrderData = webhookEvent.payload?.data?.object?.order_updated 
    || webhookEvent.payload?.data?.object?.order_created;
  
  if (!webhookOrderData) {
    console.error('Webhook payload:', JSON.stringify(webhookEvent.payload, null, 2));
    throw new Error('No order data in webhook payload');
  }
  
  console.log(`Processing ${webhookEvent.event_type} for order ${webhookOrderData.id}`);
  
  // Step 2: Fetch complete order data from Square API
  let orderData;
  try {
    orderData = await fetchOrderFromSquareAPI(
      supabase,
      webhookOrderData.id,
      webhookOrderData.location_id
    );
    console.log(`✅ Fetched complete order data from Square API: ${orderData.line_items?.length || 0} line items`);
  } catch (apiError) {
    console.error('Failed to fetch order from Square API:', apiError);
    // Fallback: use minimal webhook data (will have limited info)
    orderData = {
      id: webhookOrderData.id,
      location_id: webhookOrderData.location_id,
      state: webhookOrderData.state,
      version: webhookOrderData.version,
      created_at: webhookOrderData.created_at,
      updated_at: webhookOrderData.updated_at
    };
    console.warn('⚠️ Using minimal webhook data, bill display may be incomplete');
  }

  // Upsert into square_orders
  const { error: upsertError } = await supabase
    .from('square_orders')
    .upsert({
      order_id: orderData.id,
      location_id: orderData.location_id,
      state: orderData.state,
      source: orderData.source?.name,
      opened_at: orderData.created_at,
      closed_at: orderData.closed_at,
      total_money: orderData.total_money?.amount,
      tip_money: orderData.total_tip_money?.amount,
      discount_money: orderData.total_discount_money?.amount,
      service_charge_money: orderData.total_service_charge_money?.amount,
      taxes_money: orderData.total_tax_money?.amount,
      version: orderData.version,
      customer_id: orderData.customer_id,
      note: orderData.note,
      raw: orderData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'order_id'
    });

  if (upsertError) {
    throw new Error(`Failed to upsert order: ${upsertError.message}`);
  }

  // Attempt auto-linking
  let linked = false;
  let linkMethod = '';
  let confidence = 0.0;
  let visitData = null;

  // Try linking by Square customer_id
  if (orderData.customer_id) {
    const { data, error } = await supabase
      .rpc('grace_find_active_visit_by_square_customer', {
        p_customer_id: orderData.customer_id
      });

    if (!error && data && data.length > 0) {
      visitData = data[0];
      linkMethod = 'square_customer_id';
      confidence = 0.9;
      linked = true;
    }
  }

  // Try linking by booking code in note
  if (!linked && orderData.note) {
    const bookingCodeMatch = orderData.note.match(/BK-\d{4}-\d{6}/);
    if (bookingCodeMatch) {
      const { data, error } = await supabase
        .rpc('grace_find_visit_by_booking_code', {
          p_code: bookingCodeMatch[0]
        });

      if (!error && data && data.length > 0) {
        visitData = data[0];
        linkMethod = 'booking_code';
        confidence = 0.95;
        linked = true;
      }
    }
  }

  if (linked && visitData) {
    // Create order link
    await supabase
      .from('order_links')
      .upsert({
        order_id: orderData.id,
        visit_id: visitData.visit_id,
        reservation_id: visitData.reservation_id,
        guest_id: visitData.guest_id,
        link_method: linkMethod,
        confidence: confidence
      }, {
        onConflict: 'order_id,visit_id'
      });

    // Apply metrics (stub)
    if (visitData.visit_id) {
      await supabase.rpc('grace_apply_order_to_visit_metrics', {
        p_order_id: orderData.id,
        p_visit_id: visitData.visit_id
      });
    }

    console.log(`Auto-linked order ${orderData.id} via ${linkMethod}`);
  } else {
    // Auto-walk-in path
    console.log(`No match found for order ${orderData.id}, attempting auto-walk-in...`);
    
    // Step 1: Resolve venue
    const venueId = await resolveVenue(supabase, orderData.location_id);
    if (!venueId) {
      console.log(`No venue mapping for location ${orderData.location_id}`);
      // Create enriched review task
      await supabase.from('order_link_reviews').insert({
        order_id: orderData.id,
        reason: 'no_venue_mapping',
        confidence: 0.0,
        snapshot: {
          // Order identification
          order_id: orderData.id,
          location_id: orderData.location_id,
          state: orderData.state,
          version: orderData.version,
          
          // Timing
          opened_at: orderData.created_at,
          updated_at: orderData.updated_at,
          closed_at: orderData.closed_at,
          
          // Customer & context
          customer_id: orderData.customer_id,
          note: orderData.note,
          
          // Source & device
          source_name: orderData.source?.name,
          device_id: orderData.source?.device_id,
          
          // Table names from fulfillments
          table_names: orderData.fulfillments
            ?.filter((f: any) => f.type === 'SHIPMENT' && f.shipment_details?.recipient?.display_name)
            .map((f: any) => f.shipment_details.recipient.display_name) || [],
          
          // Money breakdown
          money: {
            subtotal: orderData.net_amounts?.total_money?.amount || 0,
            discount: orderData.net_amounts?.discount_money?.amount || 0,
            service_charge: orderData.net_amounts?.service_charge_money?.amount || 0,
            tax: orderData.net_amounts?.tax_money?.amount || 0,
            tip: orderData.net_amounts?.tip_money?.amount || 0,
            total: orderData.total_money?.amount || 0
          },
          
          // Line items
          line_items_count: orderData.line_items?.length || 0
        },
        status: 'open'
      });
      return;
    }
    
    // Step 2: Handle guest if customer_id exists
    let guestId: string | null = null;
    if (orderData.customer_id) {
      guestId = await findOrCreateGuestBySquareCustomer(
        supabase, 
        venueId, 
        orderData.customer_id
      );
    }
    
    // Step 3: Resolve seating
    const seating = await resolveSeating(
      supabase,
      venueId,
      orderData.location_id,
      orderData.source?.device_id || null,
      orderData.source?.name || null
    );
    
    // Step 4: Create walk-in
    const { data: visitIdData, error: walkInError } = await supabase
      .rpc('grace_create_walk_in', {
        p_venue_id: venueId,
        p_area_id: seating.areaId,
        p_table_id: seating.tableId,
        p_guest_id: guestId,
        p_source: 'Square POS',
        p_opened_at: orderData.created_at
      });
    
    if (walkInError) {
      console.error('Failed to create walk-in:', walkInError);
      // Fallback to enriched review task
      await supabase.from('order_link_reviews').insert({
        order_id: orderData.id,
        reason: 'walk_in_creation_failed',
        confidence: 0.0,
        snapshot: {
          // Order identification
          order_id: orderData.id,
          location_id: orderData.location_id,
          state: orderData.state,
          version: orderData.version,
          
          // Timing
          opened_at: orderData.created_at,
          updated_at: orderData.updated_at,
          closed_at: orderData.closed_at,
          
          // Customer & context
          customer_id: orderData.customer_id,
          note: orderData.note,
          
          // Source & device
          source_name: orderData.source?.name,
          device_id: orderData.source?.device_id,
          
          // Table names from fulfillments
          table_names: orderData.fulfillments
            ?.filter((f: any) => f.type === 'SHIPMENT' && f.shipment_details?.recipient?.display_name)
            .map((f: any) => f.shipment_details.recipient.display_name) || [],
          
          // Money breakdown
          money: {
            subtotal: orderData.net_amounts?.total_money?.amount || 0,
            discount: orderData.net_amounts?.discount_money?.amount || 0,
            service_charge: orderData.net_amounts?.service_charge_money?.amount || 0,
            tax: orderData.net_amounts?.tax_money?.amount || 0,
            tip: orderData.net_amounts?.tip_money?.amount || 0,
            total: orderData.total_money?.amount || 0
          },
          
          // Line items
          line_items_count: orderData.line_items?.length || 0,
          
          // Error details
          error: String(walkInError)
        },
        status: 'open'
      });
      return;
    }
    
    const visitId = visitIdData;
    
    // Step 5: Create order link
    await supabase
      .from('order_links')
      .upsert({
        order_id: orderData.id,
        visit_id: visitId,
        reservation_id: visitId,
        guest_id: guestId,
        link_method: 'auto_walk_in',
        confidence: 0.8
      }, {
        onConflict: 'order_id,visit_id'
      });
    
    console.log(`✅ Auto-created walk-in for order ${orderData.id} at table ${seating.tableId || 'unassigned'}`);
  }
}
