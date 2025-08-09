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
    const { booking_id, amount_cents, venue_id, custom_message } = await req.json()

    console.log('📧 Processing payment request:', {
      booking_id,
      amount_cents,
      venue_id,
      custom_message
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch booking data
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('id, guest_name, email, booking_date, booking_time, party_size, service, booking_reference')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      console.error('❌ Error fetching booking:', bookingError)
      throw new Error('Booking not found')
    }

    console.log('🎫 Booking info:', booking)

    // Generate payment intent ID
    const paymentIntentId = `pi_${booking_id}_${Date.now()}`

    // Get venue info for branding and app domain
    const { data: venue, error: venueError } = await supabaseClient
      .from('venues')
      .select('name, slug')
      .eq('id', venue_id)
      .single()

    if (venueError || !venue) {
      console.error('❌ Error fetching venue:', venueError)
      throw new Error('Venue not found')
    }

    console.log('🏢 Venue info:', venue)

    // Get platform settings for email configuration and app domain
    const { data: platformSettings, error: settingsError } = await supabaseClient
      .from('platform_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['from_email', 'from_name', 'email_signature', 'app_domain'])

    if (settingsError) {
      console.error('❌ Error fetching platform settings:', settingsError)
    }

    // Convert settings to object
    const settings = platformSettings?.reduce((acc, setting) => {
      acc[setting.setting_key] = JSON.parse(setting.setting_value)
      return acc
    }, {} as Record<string, string>) || {}

    // Use default values if settings not found
    const fromEmail = settings.from_email || 'nuthatch@grace-os.co.uk'
    const fromName = settings.from_name || 'Grace OS'
    const emailSignature = settings.email_signature || 'Best regards,\nThe Nuthatch Team'
    const appDomain = settings.app_domain || 'https://wxyotttvyexxzeaewyga.lovable.app'

    // Format booking details
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const formattedTime = booking.booking_time
    const formattedAmount = (amount_cents / 100).toFixed(2)

    // Create payment link pointing to our React app
    const paymentLink = `${appDomain}/payment/${paymentIntentId}`
    
    console.log('💳 Payment link created:', paymentLink)

    // Create branded HTML email template matching the booking confirmation style
    const subject = `Payment Required - ${venue.name}`
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${appDomain}/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Payment Request</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Payment Required for Your Booking</h2>
          <p>Dear ${booking.guest_name},</p>
          <p>To secure your booking at ${venue.name}, please complete your payment of <strong>£${formattedAmount}</strong>.</p>
          
          ${custom_message ? `<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Personal Message:</strong></p>
            <p style="margin: 5px 0 0 0; color: #856404;">${custom_message}</p>
          </div>` : ''}
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Booking Details</h3>
            <p><strong>Reference:</strong> ${booking.booking_reference}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Party Size:</strong> ${booking.party_size} guests</p>
            <p><strong>Service:</strong> ${booking.service}</p>
            <p><strong>Venue:</strong> ${venue.name}</p>
            <p><strong>Amount Due:</strong> £${formattedAmount}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="background: #8B4513; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Complete Payment</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            <strong>Important:</strong> This payment request will expire in 24 hours. If you have any questions or need assistance, please contact us directly.
          </p>
          
          <p>We look forward to welcoming you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>${emailSignature}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>
    `

    // Send email directly via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured')
      throw new Error('Email service not configured')
    }

    console.log('📤 Sending payment request email via Resend:', {
      from: `${fromName} <${fromEmail}>`,
      to: booking.email,
      subject
    })

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [booking.email],
        subject,
        html: htmlContent,
      }),
    })

    const responseText = await resendResponse.text()
    console.log('📬 Resend response status:', resendResponse.status)
    console.log('📬 Resend response:', responseText)

    if (!resendResponse.ok) {
      console.error('❌ Resend API error:', {
        status: resendResponse.status,
        response: responseText
      })
      
      // Try to parse error details
      let errorDetails = 'Unknown Resend error'
      try {
        const errorData = JSON.parse(responseText)
        errorDetails = errorData.message || JSON.stringify(errorData)
      } catch (e) {
        errorDetails = responseText || `HTTP ${resendResponse.status}`
      }
      
      throw new Error(`Resend API error: ${errorDetails}`)
    }

    const resendResult = JSON.parse(responseText)
    console.log('✅ Payment request email sent successfully:', resendResult.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment request sent successfully',
        payment_link: paymentLink,
        resend_id: resendResult.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Send payment request error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send payment request',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
