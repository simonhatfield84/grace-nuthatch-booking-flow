
import { supabase } from "@/integrations/supabase/client";

export const emailService = {
  async sendBookingConfirmation(
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venue_slug: string
  ) {
    try {
      // Get current user's venue ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();

      if (!profile?.venue_id) throw new Error('Venue not found');

      // Get venue-specific email settings
      const { data: venueSettings } = await supabase
        .from('venue_settings')
        .select('setting_key, setting_value')
        .eq('venue_id', profile.venue_id)
        .in('setting_key', ['from_email', 'from_name', 'email_signature']);

      const emailSettings: Record<string, string> = {};
      venueSettings?.forEach(setting => {
        try {
          const parsedValue = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
          emailSettings[setting.setting_key] = String(parsedValue || '');
        } catch {
          emailSettings[setting.setting_key] = String(setting.setting_value || '');
        }
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: guestEmail,
          subject: `Booking Confirmation - ${bookingData.venue_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
                <p style="color: #64748b; margin: 5px 0;">Booking Confirmation</p>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
                <h2 style="color: #1e293b; margin-top: 0;">Your booking is confirmed!</h2>
                <p>Dear ${bookingData.guest_name},</p>
                <p>Thank you for your booking at ${bookingData.venue_name}.</p>
                
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #ea580c;">Booking Details</h3>
                  <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
                  <p><strong>Date:</strong> ${bookingData.booking_date}</p>
                  <p><strong>Time:</strong> ${bookingData.booking_time}</p>
                  <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
                  <p><strong>Venue:</strong> ${bookingData.venue_name}</p>
                </div>
                
                <p>We look forward to seeing you!</p>
              </div>
              
              <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
                <p>${emailSettings.email_signature || 'Best regards,\nYour Venue Team'}</p>
              </div>
            </div>
          `,
          from_email: emailSettings.from_email || 'noreply@grace-os.co.uk',
          from_name: emailSettings.from_name || bookingData.venue_name,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
      return false;
    }
  },

  async sendBookingReminder(
    guestEmail: string,
    bookingData: {
      guest_name: string;
      venue_name: string;
      booking_date: string;
      booking_time: string;
      party_size: string;
      booking_reference: string;
    },
    venue_slug: string
  ) {
    try {
      // Get current user's venue ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();

      if (!profile?.venue_id) throw new Error('Venue not found');

      // Get venue-specific email settings
      const { data: venueSettings } = await supabase
        .from('venue_settings')
        .select('setting_key, setting_value')
        .eq('venue_id', profile.venue_id)
        .in('setting_key', ['from_email', 'from_name', 'email_signature']);

      const emailSettings: Record<string, string> = {};
      venueSettings?.forEach(setting => {
        try {
          const parsedValue = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
          emailSettings[setting.setting_key] = String(parsedValue || '');
        } catch {
          emailSettings[setting.setting_key] = String(setting.setting_value || '');
        }
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: guestEmail,
          subject: `Booking Reminder - ${bookingData.venue_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
                <p style="color: #64748b; margin: 5px 0;">Booking Reminder</p>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
                <h2 style="color: #1e293b; margin-top: 0;">Don't forget your booking!</h2>
                <p>Dear ${bookingData.guest_name},</p>
                <p>This is a friendly reminder about your upcoming booking at ${bookingData.venue_name}.</p>
                
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #ea580c;">Booking Details</h3>
                  <p><strong>Reference:</strong> ${bookingData.booking_reference}</p>
                  <p><strong>Date:</strong> ${bookingData.booking_date}</p>
                  <p><strong>Time:</strong> ${bookingData.booking_time}</p>
                  <p><strong>Party Size:</strong> ${bookingData.party_size}</p>
                  <p><strong>Venue:</strong> ${bookingData.venue_name}</p>
                </div>
                
                <p>We look forward to seeing you!</p>
              </div>
              
              <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
                <p>${emailSettings.email_signature || 'Best regards,\nYour Venue Team'}</p>
              </div>
            </div>
          `,
          from_email: emailSettings.from_email || 'noreply@grace-os.co.uk',
          from_name: emailSettings.from_name || bookingData.venue_name,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send booking reminder:', error);
      return false;
    }
  },

  async sendUserInvitation(
    userEmail: string,
    invitationData: {
      venue_name: string;
      invitation_link: string;
    }
  ) {
    try {
      // Get platform settings for user invitations (these should still use platform settings)
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['from_email', 'from_name', 'email_signature']);

      const platformSettings: Record<string, string> = {};
      settings?.forEach(setting => {
        try {
          const parsedValue = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
          platformSettings[setting.setting_key] = String(parsedValue || '');
        } catch {
          platformSettings[setting.setting_key] = String(setting.setting_value || '');
        }
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: userEmail,
          subject: `You're invited to join ${invitationData.venue_name} on Grace OS`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
                <p style="color: #64748b; margin: 5px 0;">You're Invited!</p>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
                <h2 style="color: #1e293b; margin-top: 0;">Join ${invitationData.venue_name}</h2>
                <p>You've been invited to join ${invitationData.venue_name} on Grace OS, the modern hospitality management platform.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationData.invitation_link}" style="background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Accept Invitation</a>
                </div>
                
                <p>If the button doesn't work, copy and paste this link:</p>
                <p style="word-break: break-all; color: #ea580c;">${invitationData.invitation_link}</p>
              </div>
              
              <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
                <p>${platformSettings.email_signature || 'Best regards,\nFred at Grace OS'}</p>
              </div>
            </div>
          `,
          from_email: platformSettings.from_email || 'noreply@grace-os.co.uk',
          from_name: platformSettings.from_name || 'Fred at Grace OS',
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send user invitation:', error);
      return false;
    }
  },
};
