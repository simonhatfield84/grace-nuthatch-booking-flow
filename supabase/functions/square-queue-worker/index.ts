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
        if (webhookEvent.event_type === 'order.updated' || webhookEvent.event_type === 'order.created') {
          await processOrderUpdated(supabase, webhookEvent);
        } else if (webhookEvent.event_type === 'payment.updated' || webhookEvent.event_type === 'payment.created') {
          await processPaymentUpdated(supabase, webhookEvent);
        } else {
          console.log(`⚠️ Unhandled event type: ${webhookEvent.event_type}`);
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
  tableName: string | null,
  deviceId: string | null, 
  sourceName: string | null
): Promise<{ areaId: number | null; tableId: number | null }> {
  // 1. HIGHEST PRIORITY: Direct table label lookup
  if (tableName) {
    const { data: table } = await supabase
      .from('tables')
      .select('id, section_id')
      .eq('venue_id', venueId)
      .eq('label', tableName)
      .eq('status', 'active')
      .maybeSingle();
    
    if (table) {
      console.log(`✅ Resolved ticket "${tableName}" → Grace table ${table.id}`);
      return {
        areaId: table.section_id,
        tableId: table.id
      };
    } else {
      console.log(`⚠️ No active table with label "${tableName}" found in venue ${venueId}`);
    }
  }
  
  // 2. FALLBACK: Try device map lookup
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
    console.log(`✅ Resolved via device mapping → area ${deviceMap.grace_area_id}, table ${deviceMap.grace_table_id}`);
    return {
      areaId: deviceMap.grace_area_id,
      tableId: deviceMap.grace_table_id
    };
  }
  
  // 3. Final fallback: seating policy
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
  
  // Fetch customer details from Square API
  let customerData = null;
  try {
    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_MERCHANT_ACCESS_TOKEN');
    const SQUARE_VERSION = Deno.env.get('SQUARE_VERSION') || '2024-10-17';
    
    if (!SQUARE_ACCESS_TOKEN) {
      console.warn(`⚠️ SQUARE_MERCHANT_ACCESS_TOKEN not found - cannot fetch customer ${customerId}`);
    } else {
      console.log(`🔍 Fetching customer ${customerId} from Square API...`);
      const response = await fetch(
        `https://connect.squareup.com/v2/customers/${customerId}`,
        {
          headers: {
            'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
            'Square-Version': SQUARE_VERSION,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        customerData = data.customer;
        console.log(`✅ Fetched customer: ${customerData.given_name} ${customerData.family_name}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch customer from Square: ${response.status} - ${errorText}`);
      }
    }
  } catch (error) {
    console.error('❌ Error fetching customer from Square:', error);
  }
  
  // Create new guest with actual customer data
  const guestName = customerData 
    ? `${customerData.given_name || ''} ${customerData.family_name || ''}`.trim() || 'Square Customer'
    : 'Square Customer';
  
  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      venue_id: venueId,
      name: guestName,
      email: customerData?.email_address || null,
      phone: customerData?.phone_number || null,
      square_customer_id: customerId,
      square_customer_raw: customerData,
      opt_in_marketing: false
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to create guest:', error);
    return null;
  }
  
  console.log(`✅ Created guest: ${guestName} (${newGuest.id})`);
  return newGuest.id;
}

// Helper: Fetch payment from Square API using Production token
async function fetchSquarePayment(
  paymentId: string,
  locationId?: string
): Promise<any> {
  const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_MERCHANT_ACCESS_TOKEN');
  const SQUARE_VERSION = Deno.env.get('SQUARE_VERSION') || '2024-10-17';
  
  if (!SQUARE_ACCESS_TOKEN) {
    throw new Error('SQUARE_MERCHANT_ACCESS_TOKEN not configured');
  }
  
  const apiBase = 'https://connect.squareup.com/v2'; // Production only
  
  const url = locationId 
    ? `${apiBase}/payments/${paymentId}?location_id=${locationId}`
    : `${apiBase}/payments/${paymentId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Square-Version': SQUARE_VERSION,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Square API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.payment;
}

// Helper: Fetch order using Production token (alternative to OAuth)
async function fetchSquareOrder(
  orderId: string,
  locationId?: string
): Promise<any> {
  const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_MERCHANT_ACCESS_TOKEN');
  const SQUARE_VERSION = Deno.env.get('SQUARE_VERSION') || '2024-10-17';
  
  if (!SQUARE_ACCESS_TOKEN) {
    // Fall back to OAuth token fetch
    console.log('⚠️ SQUARE_MERCHANT_ACCESS_TOKEN not set, using OAuth fallback');
    return null; // Caller will use fetchOrderFromSquareAPI
  }
  
  const apiBase = 'https://connect.squareup.com/v2';
  
  const url = locationId
    ? `${apiBase}/orders/${orderId}?location_id=${locationId}`
    : `${apiBase}/orders/${orderId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Square-Version': SQUARE_VERSION,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Square API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.order;
}

// Helper: Fetch complete order data from Square API using OAuth tokens (fallback)
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
  return data.order;
}

async function processOrderUpdated(supabase: any, webhookEvent: any) {
  // Step 1: Extract minimal order info from webhook
  const webhookOrderData = webhookEvent.payload?.data?.object?.order_updated 
    || webhookEvent.payload?.data?.object?.order_created
    || webhookEvent.payload?.data?.object?.order;
  
  if (!webhookOrderData) {
    console.error('Webhook payload:', JSON.stringify(webhookEvent.payload, null, 2));
    throw new Error('No order data in webhook payload');
  }
  
  // CRITICAL FIX: Webhook uses 'order_id' field, not 'id'
  const orderId = webhookOrderData.order_id || webhookOrderData.id;
  const locationId = webhookOrderData.location_id;
  
  if (!orderId) {
    throw new Error('No order ID in webhook data');
  }
  
  console.log(`Processing ${webhookEvent.event_type} for order ${orderId}`);
  
  // Step 2: Fetch complete order data from Square API
  let orderData;
  try {
    // Try Production token first (preferred for production)
    console.log(`🔍 Fetching order ${orderId} from Square API (Production token)...`);
    orderData = await fetchSquareOrder(orderId, locationId);
    
    // Fallback to OAuth token if Production token not set
    if (!orderData) {
      console.log(`🔍 Fetching order ${orderId} from Square API (OAuth fallback)...`);
      orderData = await fetchOrderFromSquareAPI(supabase, orderId, locationId);
    }
    
    console.log(`✅ Fetched complete order data from Square API: ${orderData?.line_items?.length || 0} line items`);
  } catch (apiError) {
    console.error('Failed to fetch order from Square API:', apiError);
    console.error('API Error details:', apiError.message);
    
    // Fallback: use minimal webhook data
    orderData = {
      id: orderId, // FIX: Use extracted orderId
      location_id: locationId,
      state: webhookOrderData.state,
      version: webhookOrderData.version,
      created_at: webhookOrderData.created_at,
      updated_at: webhookOrderData.updated_at
    };
    console.warn('⚠️ Using minimal webhook data, bill display may be incomplete');
  }
  
  // Ensure order data has ID (defensive)
  if (!orderData || !orderData.id) {
    throw new Error(`Order data missing ID after fetch (orderId: ${orderId})`);
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
      tip_money: orderData.tip_money?.amount,
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

  console.log(`✅ Order ${orderData.id} upserted successfully`);
  
  // Upsert line items for bill display
  if (orderData.line_items && orderData.line_items.length > 0) {
    console.log(`💳 Upserting ${orderData.line_items.length} line items for order ${orderData.id}`);
    
    for (const item of orderData.line_items) {
      await supabase
        .from('square_order_line_items')
        .upsert({
          order_id: orderData.id,
          line_item_uid: item.uid,
          name: item.name,
          catalog_object_id: item.catalog_object_id,
          variation_name: item.variation_name,
          quantity: item.quantity,
          base_price_money: item.base_price_money?.amount,
          total_money: item.total_money?.amount || item.gross_sales_money?.amount,
          modifiers: item.modifiers || [],
          note: item.note
        }, {
          onConflict: 'order_id,line_item_uid,name,total_money',
          ignoreDuplicates: false // Update on conflict
        });
    }
    
    console.log(`✅ Line items upserted for order ${orderData.id}`);
  }

  // Step 3: Auto-link to existing visit
  let linkedVisitId: string | null = null;

  // A. Try linking by Square customer_id
  if (orderData.customer_id) {
    const { data: visitByCustomer, error } = await supabase.rpc(
      'grace_find_active_visit_by_square_customer',
      { p_customer_id: orderData.customer_id }
    );

    if (!error && visitByCustomer && visitByCustomer.length > 0) {
      const visit = visitByCustomer[0];
      linkedVisitId = visit.visit_id || visit.reservation_id;
      
      if (linkedVisitId) {
        await supabase.from('order_links').insert({
          order_id: orderData.id,
          visit_id: linkedVisitId,
          reservation_id: visit.reservation_id,
          guest_id: visit.guest_id,
          link_method: 'square_customer_id',
          confidence: 0.9
        }).onConflict('order_id').ignore();
        
        console.log(`✅ Linked order ${orderData.id} to visit ${linkedVisitId} via customer_id`);
      }
    }
  }

  // B. Try linking by booking code in order note
  if (!linkedVisitId && orderData.note) {
    const bookingCodeMatch = orderData.note.match(/BK-\d{4}-\d{6}/);
    if (bookingCodeMatch) {
      const bookingCode = bookingCodeMatch[0];
      const { data: visitByCode, error } = await supabase.rpc(
        'grace_find_visit_by_booking_code',
        { p_code: bookingCode }
      );

      if (!error && visitByCode && visitByCode.length > 0) {
        const visit = visitByCode[0];
        linkedVisitId = visit.visit_id || visit.reservation_id;
        
        if (linkedVisitId) {
          await supabase.from('order_links').insert({
            order_id: orderData.id,
            visit_id: linkedVisitId,
            reservation_id: visit.reservation_id,
            guest_id: visit.guest_id,
            link_method: 'booking_code',
            confidence: 0.95
          }).onConflict('order_id').ignore();
          
          console.log(`✅ Linked order ${orderData.id} to visit ${linkedVisitId} via booking code`);
        }
      }
    }
  }

  // C. If still not linked, attempt walk-in creation
  if (!linkedVisitId) {
    const venueId = await resolveVenue(supabase, orderData.location_id);
    
    if (!venueId) {
      console.log(`⚠️ No venue mapping for location ${orderData.location_id}, creating review task`);
      
      // Create enriched review snapshot
      await supabase.from('order_link_reviews').insert({
        order_id: orderData.id,
        reason: 'no_venue_mapping',
        confidence: 0.0,
        snapshot: {
          order_id: orderData.id,
          location_id: orderData.location_id,
          state: orderData.state,
          opened_at: orderData.created_at,
          updated_at: orderData.updated_at,
          closed_at: orderData.closed_at,
          customer_id: orderData.customer_id,
          note: orderData.note,
          source_name: orderData.source?.name,
          device_id: orderData.source?.device_id,
          table_names: orderData.fulfillments
            ?.filter((f: any) => f.type === 'SHIPMENT' && f.shipment_details?.recipient?.display_name)
            .map((f: any) => f.shipment_details.recipient.display_name) || [],
          money: {
            subtotal: orderData.net_amounts?.total_money?.amount || 0,
            discount: orderData.net_amounts?.discount_money?.amount || 0,
            service_charge: orderData.net_amounts?.service_charge_money?.amount || 0,
            tax: orderData.net_amounts?.tax_money?.amount || 0,
            tip: orderData.net_amounts?.tip_money?.amount || 0,
            total: orderData.total_money?.amount || 0
          },
          line_items_count: orderData.line_items?.length || 0,
          full_order: orderData
        },
        status: 'open'
      });
      return;
    }

    // Try to create walk-in
    const tableName = orderData.ticket_name || null;
    const { areaId, tableId } = await resolveSeating(
      supabase,
      venueId,
      orderData.location_id,
      tableName,
      orderData.source?.device_id,
      orderData.source?.name
    );

    let guestId: string | null = null;
    if (orderData.customer_id) {
      guestId = await findOrCreateGuestBySquareCustomer(
        supabase,
        venueId,
        orderData.customer_id
      );
    }

    if (tableId) {
      // Create walk-in
      const { data: newVisitId, error: walkInError } = await supabase.rpc(
        'grace_create_walk_in',
        {
          p_venue_id: venueId,
          p_area_id: areaId,
          p_table_id: tableId,
          p_guest_id: guestId,
          p_source: 'other',
          p_opened_at: orderData.created_at
        }
      );

      if (walkInError) {
        console.error('Failed to create walk-in:', walkInError);
        
        // Create review for failed walk-in
        await supabase.from('order_link_reviews').insert({
          order_id: orderData.id,
          reason: 'walk_in_creation_failed',
          confidence: 0.0,
          snapshot: {
            order_id: orderData.id,
            location_id: orderData.location_id,
            state: orderData.state,
            opened_at: orderData.created_at,
            updated_at: orderData.updated_at,
            closed_at: orderData.closed_at,
            customer_id: orderData.customer_id,
            note: orderData.note,
            source_name: orderData.source?.name,
            device_id: orderData.source?.device_id,
            table_names: orderData.fulfillments
              ?.filter((f: any) => f.type === 'SHIPMENT' && f.shipment_details?.recipient?.display_name)
              .map((f: any) => f.shipment_details.recipient.display_name) || [],
            money: {
              subtotal: orderData.net_amounts?.total_money?.amount || 0,
              discount: orderData.net_amounts?.discount_money?.amount || 0,
              service_charge: orderData.net_amounts?.service_charge_money?.amount || 0,
              tax: orderData.net_amounts?.tax_money?.amount || 0,
              tip: orderData.net_amounts?.tip_money?.amount || 0,
              total: orderData.total_money?.amount || 0
            },
            line_items_count: orderData.line_items?.length || 0,
            full_order: orderData,
            error: walkInError.message
          },
          status: 'open'
        });
        return;
      }

      // Link order to walk-in
      await supabase.from('order_links').insert({
        order_id: orderData.id,
        visit_id: newVisitId,
        reservation_id: newVisitId,
        guest_id: guestId,
        link_method: 'auto_walk_in',
        confidence: 0.7
      });

      console.log(`✅ Created walk-in visit ${newVisitId} and linked order ${orderData.id}`);
    } else {
      console.log(`⚠️ No table mapping available, creating review task`);
      
      // Create review for unassigned order
      await supabase.from('order_link_reviews').insert({
        order_id: orderData.id,
        reason: 'no_table_assignment',
        confidence: 0.0,
        snapshot: {
          order_id: orderData.id,
          location_id: orderData.location_id,
          state: orderData.state,
          opened_at: orderData.created_at,
          updated_at: orderData.updated_at,
          closed_at: orderData.closed_at,
          customer_id: orderData.customer_id,
          note: orderData.note,
          source_name: orderData.source?.name,
          device_id: orderData.source?.device_id,
          table_names: orderData.fulfillments
            ?.filter((f: any) => f.type === 'SHIPMENT' && f.shipment_details?.recipient?.display_name)
            .map((f: any) => f.shipment_details.recipient.display_name) || [],
          money: {
            subtotal: orderData.net_amounts?.total_money?.amount || 0,
            discount: orderData.net_amounts?.discount_money?.amount || 0,
            service_charge: orderData.net_amounts?.service_charge_money?.amount || 0,
            tax: orderData.net_amounts?.tax_money?.amount || 0,
            tip: orderData.net_amounts?.tip_money?.amount || 0,
            total: orderData.total_money?.amount || 0
          },
          line_items_count: orderData.line_items?.length || 0,
          full_order: orderData
        },
        status: 'open'
      });
    }
  }
}

async function processPaymentUpdated(supabase: any, webhookEvent: any) {
  // Extract payment data from webhook
  const webhookPaymentData = webhookEvent.payload?.data?.object?.payment
    || webhookEvent.payload?.data?.object?.payment_updated
    || webhookEvent.payload?.data?.object?.payment_created;
  
  if (!webhookPaymentData) {
    console.error('Webhook payload:', JSON.stringify(webhookEvent.payload, null, 2));
    throw new Error('No payment data in webhook payload');
  }
  
  // CRITICAL FIX: Webhook uses 'payment_id' field, not 'id'
  const paymentId = webhookPaymentData.payment_id || webhookPaymentData.id;
  const locationId = webhookPaymentData.location_id;
  
  if (!paymentId) {
    throw new Error('No payment ID in webhook data');
  }
  
  console.log(`Processing ${webhookEvent.event_type} for payment ${paymentId}`);
  
  // Fetch complete payment data from Square API
  let paymentData;
  try {
    console.log(`🔍 Fetching payment ${paymentId} from Square API...`);
    paymentData = await fetchSquarePayment(paymentId, locationId);
    console.log(`✅ Fetched payment data: ${paymentData.status} - ${paymentData.total_money?.amount || 0}`);
  } catch (apiError) {
    console.error('Failed to fetch payment from Square API:', apiError);
    console.error('API Error details:', apiError.message);
    
    // Fallback: use minimal webhook data
    paymentData = {
      id: paymentId, // FIX: Use extracted paymentId
      order_id: webhookPaymentData.order_id,
      location_id: locationId,
      status: webhookPaymentData.status,
      amount_money: webhookPaymentData.amount_money,
      total_money: webhookPaymentData.total_money
    };
    console.warn('⚠️ Using webhook payment data, may be incomplete');
  }
  
  // Ensure payment data has ID (defensive)
  if (!paymentData || !paymentData.id) {
    throw new Error(`Payment data missing ID after fetch (paymentId: ${paymentId})`);
  }
  
  // Upsert into square_payments
  const { error: upsertError } = await supabase
    .from('square_payments')
    .upsert({
      payment_id: paymentData.id,
      order_id: paymentData.order_id,
      location_id: paymentData.location_id,
      status: paymentData.status,
      amount_money: paymentData.amount_money?.amount,
      tip_money: paymentData.tip_money?.amount,
      approved_money: paymentData.approved_money?.amount,
      total_money: paymentData.total_money?.amount,
      processing_fee_money: paymentData.processing_fee?.[0]?.amount_money?.amount,
      refunded_money: paymentData.refunded_money?.amount,
      card_brand: paymentData.card_details?.card?.card_brand,
      card_last_4: paymentData.card_details?.card?.last_4,
      customer_id: paymentData.customer_id,
      note: paymentData.note,
      receipt_url: paymentData.receipt_url,
      raw: paymentData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'payment_id'
    });
  
  if (upsertError) {
    throw new Error(`Failed to upsert payment: ${upsertError.message}`);
  }
  
  console.log(`✅ Payment ${paymentData.id} upserted successfully`);
  
  // If payment is COMPLETED, update linked visit status to 'finished'
  if (paymentData.status === 'COMPLETED' && paymentData.order_id) {
    console.log(`💰 Payment completed for order ${paymentData.order_id}, checking for linked visit...`);
    
    // Find linked visit via order_links
    const { data: orderLinks } = await supabase
      .from('order_links')
      .select('visit_id, reservation_id')
      .eq('order_id', paymentData.order_id)
      .maybeSingle();
    
    if (orderLinks && orderLinks.visit_id) {
      // Update booking status to 'finished' (using visit_id which is booking.id)
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'finished',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderLinks.visit_id)
        .in('status', ['seated', 'confirmed']); // Update if seated or confirmed
      
      if (updateError) {
        console.error('Failed to update visit status:', updateError);
      } else {
        console.log(`✅ Visit ${orderLinks.visit_id} marked as finished after payment`);
      }
    } else {
      console.log(`ℹ️ No linked visit found for order ${paymentData.order_id}`);
    }
  }
}
