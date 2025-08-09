
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Safe function to parse settings values that might be JSON or plain text
const safeParseSettingValue = (value: any): string => {
  if (typeof value !== 'string') {
    return String(value);
  }
  
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(value);
    return String(parsed);
  } catch {
    // If JSON parsing fails, return the raw string value
    return value;
  }
};

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

    // Get venue info for branding
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

    // Get platform settings for email configuration
    const { data: platformSettings, error: settingsError } = await supabaseClient
      .from('platform_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['from_email', 'from_name', 'email_signature', 'app_domain'])

    if (settingsError) {
      console.error('❌ Error fetching platform settings:', settingsError)
    }

    // Convert settings to object using safe parsing
    const settings = platformSettings?.reduce((acc, setting) => {
      acc[setting.setting_key] = safeParseSettingValue(setting.setting_value);
      return acc
    }, {} as Record<string, string>) || {}

    // Use The Nuthatch branding instead of Grace OS
    const fromEmail = settings.from_email || 'nuthatch@grace-os.co.uk'
    const fromName = 'The Nuthatch' // Changed from Grace OS
    const emailSignature = 'Best regards,\nThe Nuthatch Team' // Changed from Grace OS
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

    // Create The Nuthatch branded HTML email template matching the booking confirmation
    const subject = `Payment Required - ${venue.name}`
    const htmlContent = `
      <div style="font-family: 'Book Antiqua', 'Palatino Linotype', Palatino, serif; max-width: 600px; margin: 0 auto; background-color: #f8f6f0;">
        <!-- Header with logo and branding -->
        <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);">
          <img src="${appDomain}/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 80px; width: auto; margin-bottom: 20px;" />
          <h1 style="color: #f8f6f0; font-size: 24px; margin: 0; font-weight: normal; letter-spacing: 1px;">Payment Required</h1>
        </div>
        
        <!-- Main content -->
        <div style="background: #f8f6f0; padding: 40px 30px;">
          <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 4px 6px rgba(139, 69, 19, 0.1);">
            <h2 style="color: #8B4513; margin-top: 0; font-size: 28px; font-weight: normal; text-align: center; margin-bottom: 25px;">Your Booking Awaits Payment</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #5D4037; margin-bottom: 20px;">Dear ${booking.guest_name},</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #5D4037; margin-bottom: 25px;">Your reservation at <strong>The Nuthatch</strong> requires payment confirmation. Please complete your payment of <strong style="color: #8B4513;">£${formattedAmount}</strong> to secure your table.</p>
            
            ${custom_message ? `
            <div style="background: #fff8e1; border-left: 4px solid #8B4513; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <h4 style="color: #8B4513; margin: 0 0 10px 0; font-size: 16px;">Personal Message from The Nuthatch:</h4>
              <p style="margin: 0; color: #5D4037; font-style: italic; line-height: 1.5;">"${custom_message}"</p>
            </div>
            ` : ''}
            
            <!-- Booking Details Card -->
            <div style="background: #f8f6f0; padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #e8d5b7;">
              <h3 style="margin-top: 0; color: #8B4513; font-size: 20px; margin-bottom: 20px; text-align: center;">Reservation Details</h3>
              <div style="display: table; width: 100%;">
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 8px 0; font-weight: bold; color: #5D4037; width: 40%;">Reference:</div>
                  <div style="display: table-cell; padding: 8px 0; color: #5D4037;">${booking.booking_reference}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 8px 0; font-weight: bold; color: #5D4037; width: 40%;">Date:</div>
                  <div style="display: table-cell; padding: 8px 0; color: #5D4037;">${formattedDate}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 8px 0; font-weight: bold; color: #5D4037; width: 40%;">Time:</div>
                  <div style="display: table-cell; padding: 8px 0; color: #5D4037;">${formattedTime}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 8px 0; font-weight: bold; color: #5D4037; width: 40%;">Party Size:</div>
                  <div style="display: table-cell; padding: 8px 0; color: #5D4037;">${booking.party_size} guests</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 8px 0; font-weight: bold; color: #5D4037; width: 40%;">Service:</div>
                  <div style="display: table-cell; padding: 8px 0; color: #5D4037;">${booking.service}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 12px 0; font-weight: bold; color: #8B4513; width: 40%; font-size: 18px;">Amount Due:</div>
                  <div style="display: table-cell; padding: 12px 0; color: #8B4513; font-size: 18px; font-weight: bold;">£${formattedAmount}</div>
                </div>
              </div>
            </div>
            
            <!-- Payment CTA -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${paymentLink}" style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block; box-shadow: 0 4px 8px rgba(139, 69, 19, 0.3); transition: transform 0.2s;">
                Complete Payment Securely
              </a>
            </div>
            
            <!-- Important notice -->
            <div style="background: #fff3cd; border: 1px solid #8B4513; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; color: #8B4513; font-weight: bold; text-align: center; font-size: 14px;">
                ⏰ Payment window expires in 24 hours
              </p>
              <p style="margin: 10px 0 0 0; color: #5D4037; text-align: center; font-size: 14px;">
                Complete payment to guarantee your table at The Nuthatch
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #5D4037; margin-top: 30px;">We're excited to welcome you to The Nuthatch and provide you with an exceptional dining experience!</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); padding: 30px; text-align: center;">
          <div style="color: #f8f6f0; font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
            <p style="margin: 0;">${emailSignature}</p>
          </div>
          <div style="color: #e8d5b7; font-size: 11px;">
            <p style="margin: 0;">Powered by Grace</p>
          </div>
        </div>
      </div>
    `

    // Send email via Resend
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
