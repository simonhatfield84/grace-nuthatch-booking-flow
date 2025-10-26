
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createErrorResponse, corsHeaders } from '../_shared/errorSanitizer.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const twentyTwoHoursAgo = new Date(now.getTime() - (22 * 60 * 60 * 1000))
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000))

    // Process 22-hour reminders (2 hours before expiry)
    const { data: reminderRequests, error: reminderError } = await supabaseClient
      .from('payment_requests')
      .select(`
        *,
        bookings (
          id, guest_name, email, booking_reference, booking_date, 
          booking_time, party_size, service, venue_id
        )
      `)
      .eq('status', 'pending')
      .lt('created_at', twentyTwoHoursAgo.toISOString())
      .gt('created_at', twentyFourHoursAgo.toISOString())
      .is('reminder_sent_at', null)

    if (reminderError) {
      throw new Error('Failed to fetch reminder requests')
    }

    // Send 22-hour reminder emails
    for (const request of reminderRequests || []) {
      try {
        await sendReminderEmail(supabaseClient, request, 'payment_reminder_22h')
        
        // Mark reminder as sent
        await supabaseClient
          .from('payment_requests')
          .update({ reminder_sent_at: now.toISOString() })
          .eq('id', request.id)
      } catch (error) {
        console.error(`Failed to send reminder for request ${request.id}:`, error)
      }
    }

    // Process expired payments (24+ hours old)
    const { data: expiredRequests, error: expiredError } = await supabaseClient
      .from('payment_requests')
      .select(`
        *,
        bookings (
          id, guest_name, email, booking_reference, booking_date, 
          booking_time, party_size, service, venue_id
        )
      `)
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo.toISOString())

    if (expiredError) {
      throw new Error('Failed to fetch expired requests')
    }

    // Process expired payments
    for (const request of expiredRequests || []) {
      try {
        // Send expiry email
        await sendReminderEmail(supabaseClient, request, 'payment_expired_24h')
        
        // Update payment request status
        await supabaseClient
          .from('payment_requests')
          .update({ status: 'expired' })
          .eq('id', request.id)
        
        // Update booking status to incomplete (will move it to cancelled section)
        await supabaseClient
          .from('bookings')
          .update({ status: 'incomplete' })
          .eq('id', request.booking_id)

        // Log audit entry
        await supabaseClient
          .from('booking_audit')
          .insert([{
            booking_id: request.booking_id,
            venue_id: request.venue_id,
            change_type: 'payment_expired',
            field_name: 'status',
            old_value: 'pending_payment',
            new_value: 'incomplete',
            notes: 'Payment request expired after 24 hours'
          }])

      } catch (error) {
        console.error(`Failed to process expired request ${request.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        reminders_sent: reminderRequests?.length || 0,
        payments_expired: expiredRequests?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error, 500)
  }
})

async function sendReminderEmail(supabaseClient: any, request: any, templateKey: string) {
  const booking = request.bookings

  // Get venue details
  const { data: venue, error: venueError } = await supabaseClient
    .from('venues')
    .select('name')
    .eq('id', booking.venue_id)
    .single()

  if (venueError || !venue) {
    throw new Error('Venue not found')
  }

  // Get email template
  const { data: template, error: templateError } = await supabaseClient
    .from('email_templates')
    .select('*')
    .eq('venue_id', booking.venue_id)
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single()

  if (templateError || !template) {
    throw new Error(`Email template ${templateKey} not found`)
  }

  // Get venue signature
  const { data: emailSettings } = await supabaseClient
    .from('venue_settings')
    .select('setting_value')
    .eq('venue_id', booking.venue_id)
    .eq('setting_key', 'email_signature')
    .single()

  const emailSignature = emailSettings?.setting_value?.signature || venue.name

  // Prepare template variables
  const variables = {
    guest_name: booking.guest_name,
    venue_name: venue.name,
    booking_reference: booking.booking_reference || `BK-${booking.id}`,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    party_size: booking.party_size.toString(),
    service: booking.service,
    payment_amount: `£${(request.amount_cents / 100).toFixed(2)}`,
    payment_link: request.payment_link,
    email_signature: emailSignature
  }

  // Render template
  let subject = template.subject || ''
  let html = template.html_content || ''

  // Replace template variables
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const placeholder = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(placeholder, value.toString())
      html = html.replace(placeholder, value.toString())
    }
  })

  // Send email
  const { error: emailError } = await supabaseClient.functions.invoke('send-branded-email', {
    body: {
      to: booking.email,
      subject,
      html,
      venue_id: booking.venue_id
    }
  })

  if (emailError) {
    throw new Error('Failed to send reminder email')
  }
}
