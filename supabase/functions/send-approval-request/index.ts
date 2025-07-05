
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApprovalRequestData {
  venue_id: string
  venue_name: string
  owner_name: string
  owner_email: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { venue_id, venue_name, owner_name, owner_email }: ApprovalRequestData = await req.json()

    // Generate approval token
    const approvalToken = crypto.randomUUID()
    
    // Store approval token
    const { error: tokenError } = await supabase
      .from('approval_tokens')
      .insert({
        venue_id,
        token: approvalToken
      })

    if (tokenError) throw tokenError

    // Create approval URL (this will be the admin approval endpoint)
    const approvalUrl = `https://app.grace-os.co.uk/admin/approve?token=${approvalToken}`

    // Send approval request email to admin
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: ['hello@grace-os.co.uk'], // Replace with your admin email
        from: 'Grace OS <noreply@grace-os.co.uk>',
        subject: `New Venue Approval Request: ${venue_name}`,
        html: `
          <h1>New Venue Approval Request</h1>
          <p>A new venue has requested to join Grace OS:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Venue Details:</h3>
            <p><strong>Name:</strong> ${venue_name}</p>
            <p><strong>Owner:</strong> ${owner_name}</p>
            <p><strong>Email:</strong> ${owner_email}</p>
          </div>
          
          <div style="margin: 30px 0;">
            <a href="${approvalUrl}" 
               style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Approve Venue
            </a>
          </div>
          
          <p>This approval link will expire in 7 days.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            Grace OS Venue Management System<br>
            <a href="https://grace-os.co.uk">grace-os.co.uk</a>
          </p>
        `
      }
    })

    if (emailError) throw emailError

    console.log(`Approval request sent for venue: ${venue_name}`)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending approval request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
