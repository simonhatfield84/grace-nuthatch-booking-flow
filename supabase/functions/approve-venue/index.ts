
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      throw new Error('Approval token is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify token and get venue
    const { data: tokenData, error: tokenError } = await supabase
      .from('approval_tokens')
      .select('venue_id, used_at, expires_at')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      throw new Error('Invalid approval token')
    }

    if (tokenData.used_at) {
      throw new Error('This approval token has already been used')
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('This approval token has expired')
    }

    // Mark token as used
    await supabase
      .from('approval_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    // Approve the venue
    const { error: approvalError } = await supabase
      .from('venues')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', tokenData.venue_id)

    if (approvalError) throw approvalError

    // Get venue and owner details for confirmation email
    const { data: venue } = await supabase
      .from('venues')
      .select('name, email')
      .eq('id', tokenData.venue_id)
      .single()

    if (venue?.email) {
      // Send approval confirmation email
      await supabase.functions.invoke('send-email', {
        body: {
          to: [venue.email],
          from: 'Grace OS <noreply@grace-os.co.uk>',
          subject: `Welcome to Grace OS - ${venue.name} Approved!`,
          html: `
            <h1>Welcome to Grace OS!</h1>
            <p>Great news! Your venue <strong>${venue.name}</strong> has been approved.</p>
            
            <p>You can now access your dashboard at:</p>
            <div style="margin: 20px 0;">
              <a href="https://app.grace-os.co.uk" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Dashboard
              </a>
            </div>
            
            <p>For your front-of-house team, the host interface is available at:</p>
            <p><a href="https://host.grace-os.co.uk">host.grace-os.co.uk</a></p>
            
            <p>If you have any questions, please don't hesitate to reach out to us.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              Grace OS Team<br>
              <a href="https://grace-os.co.uk">grace-os.co.uk</a>
            </p>
          `
        }
      })
    }

    // Return success page HTML
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Grace OS - Venue Approved</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { background: #22c55e; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .logo { font-size: 2em; font-weight: bold; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="logo">grace</div>
          <div class="success">
            <h1>✅ Venue Approved Successfully</h1>
            <p>The venue has been approved and the owner has been notified.</p>
          </div>
          <p style="text-align: center; margin-top: 30px;">
            <a href="https://grace-os.co.uk">Back to Grace OS</a>
          </p>
        </body>
      </html>
    `, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 200
    })

  } catch (error) {
    console.error('Error approving venue:', error)
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Grace OS - Approval Error</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #ef4444; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .logo { font-size: 2em; font-weight: bold; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="logo">grace</div>
          <div class="error">
            <h1>❌ Approval Error</h1>
            <p>${error.message}</p>
          </div>
          <p style="text-align: center; margin-top: 30px;">
            <a href="https://grace-os.co.uk">Back to Grace OS</a>
          </p>
        </body>
      </html>
    `, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 400
    })
  }
})
