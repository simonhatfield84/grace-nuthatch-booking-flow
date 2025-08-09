
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { booking_id, venue_id, amount_cents, custom_message } = await req.json()

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    // Get venue details
    const { data: venue, error: venueError } = await supabaseClient
      .from('venues')
      .select('name, email')
      .eq('id', venue_id)
      .single()

    if (venueError || !venue) {
      throw new Error('Venue not found')
    }

    // Create Stripe payment intent with corrected parameter names
    const { data: paymentIntent, error: stripeError } = await supabaseClient.functions.invoke(
      'create-payment-intent',
      {
        body: {
          bookingId: booking_id,  // Changed from booking_id
          amount: amount_cents,   // Changed from amount_cents  
          currency: 'gbp',
          description: `Payment for booking ${booking.booking_reference || `BK-${booking_id}`}`,
          metadata: {
            venue_id: venue_id,
            guest_email: booking.email
          }
        }
      }
    )

    if (stripeError || !paymentIntent) {
      throw new Error('Failed to create payment intent')
    }

    // Create payment request record
    const paymentLink = `https://wxyotttvyexxzeaewyga.supabase.co/payment/${paymentIntent.payment_intent_id}`
    
    const { error: requestError } = await supabaseClient
      .from('payment_requests')
      .insert([{
        booking_id,
        venue_id,
        amount_cents,
        payment_link: paymentLink,
        status: 'pending'
      }])

    if (requestError) {
      throw new Error('Failed to create payment request record')
    }

    // Get payment request email template
    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('venue_id', venue_id)
      .eq('template_key', 'payment_request')
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      throw new Error('Payment request email template not found')
    }

    // Get venue signature
    const { data: emailSettings } = await supabaseClient
      .from('venue_settings')
      .select('setting_value')
      .eq('venue_id', venue_id)
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
      payment_amount: `£${(amount_cents / 100).toFixed(2)}`,
      payment_link: paymentLink,
      custom_message: custom_message || '',
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

    // Handle conditional sections
    html = html.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, condition, content) => {
      return variables[condition as keyof typeof variables] ? content : ''
    })

    // Send email using send-branded-email function
    const { error: emailError } = await supabaseClient.functions.invoke('send-branded-email', {
      body: {
        to: booking.email,
        subject,
        html,
        venue_id
      }
    })

    if (emailError) {
      throw new Error('Failed to send payment request email')
    }

    // Update booking status to pending_payment
    await supabaseClient
      .from('bookings')
      .update({ status: 'pending_payment' })
      .eq('id', booking_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_intent_id: paymentIntent.payment_intent_id,
        payment_link: paymentLink
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
