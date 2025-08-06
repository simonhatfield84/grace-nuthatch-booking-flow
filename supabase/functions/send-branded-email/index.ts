
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
    const { to, template, booking_data, venue_slug } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📧 Processing branded email request:', {
      to,
      template,
      venue_slug,
      booking_reference: booking_data?.booking_reference
    })

    // Get platform settings for email configuration
    const { data: platformSettings, error: settingsError } = await supabaseClient
      .from('platform_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['from_email', 'from_name', 'email_signature'])

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

    // Get venue info for branding
    const { data: venue } = await supabaseClient
      .from('venues')
      .select('name')
      .eq('slug', venue_slug)
      .single()

    const venueName = venue?.name || 'Restaurant'

    // Build email content based on template
    let subject = ''
    let htmlContent = ''

    if (template === 'booking_confirmation') {
      subject = `Booking Confirmation - ${venueName}`
      
      // Create booking confirmation HTML
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
            <p style="color: #64748b; margin: 5px 0;">Booking Confirmation</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">Your booking is confirmed!</h2>
            <p>Dear ${booking_data.guest_name},</p>
            <p>Thank you for your booking at ${venueName}.</p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #000000;">Booking Details</h3>
              <p><strong>Reference:</strong> ${booking_data.booking_reference}</p>
              <p><strong>Date:</strong> ${booking_data.booking_date}</p>
              <p><strong>Time:</strong> ${booking_data.booking_time}</p>
              <p><strong>Party Size:</strong> ${booking_data.party_size}</p>
              <p><strong>Venue:</strong> ${venueName}</p>
            </div>
            <p>We look forward to seeing you!</p>
          </div>
          <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
            <p>${emailSignature}</p>
            <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
          </div>
        </div>
      `
    }

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured')
      throw new Error('Email service not configured')
    }

    console.log('📤 Sending email via Resend:', {
      from: `${fromName} <${fromEmail}>`,
      to,
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
        to: [to],
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
    console.log('✅ Email sent successfully via Resend:', resendResult.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        resend_id: resendResult.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Send branded email error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
