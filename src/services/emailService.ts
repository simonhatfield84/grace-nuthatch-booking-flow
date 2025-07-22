import { supabase } from "@/integrations/supabase/client";
import { emailTemplateService, TemplateVariables } from "./emailTemplateService";

// Utility function to split full name into first and last name
function splitName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  } else if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] };
  } else {
    // More than 2 parts - first word is first name, rest is last name
    return { 
      firstName: nameParts[0], 
      lastName: nameParts.slice(1).join(' ') 
    };
  }
}

// Helper function to get accurate payment amount
async function getAccuratePaymentAmount(bookingId: number): Promise<{ amount: string; status: string } | null> {
  try {
    // First try to get the actual payment from booking_payments
    const { data: payment } = await supabase
      .from('booking_payments')
      .select('amount_cents, status')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (payment && payment.amount_cents) {
      return {
        amount: `£${(payment.amount_cents / 100).toFixed(2)}`,
        status: payment.status
      };
    }

    // Fallback: calculate based on current service pricing
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        party_size,
        service,
        services:service (
          requires_payment,
          charge_type,
          charge_amount_per_guest,
          minimum_guests_for_charge
        )
      `)
      .eq('id', bookingId)
      .single();

    if (booking?.services?.requires_payment && booking.services.charge_type === 'per_guest') {
      const chargePerGuest = booking.services.charge_amount_per_guest || 0;
      const minGuests = booking.services.minimum_guests_for_charge || 1;
      const chargingPartySize = Math.max(booking.party_size, minGuests);
      const totalAmount = chargePerGuest * chargingPartySize;
      
      return {
        amount: `£${(totalAmount / 100).toFixed(2)}`,
        status: 'calculated'
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get accurate payment amount:', error);
    return null;
  }
}

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
      booking_id?: number;
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

      // Use the edge function for all booking emails to ensure consistency
      if (bookingData.booking_id) {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            booking_id: bookingData.booking_id,
            guest_email: guestEmail,
            venue_id: profile.venue_id,
            email_type: 'booking_confirmation',
          },
        });

        if (error) throw error;
        return true;
      }

      // Fallback for bookings without ID - use legacy email sending
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
      booking_id?: number;
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

      // Generate booking tokens for cancel/modify links if booking ID is provided
      let cancelLink = '';
      let modifyLink = '';
      
      if (bookingData.booking_id) {
        try {
          const tokens = await emailTemplateService.generateBookingTokens(bookingData.booking_id);
          const baseUrl = window.location.origin;
          cancelLink = `${baseUrl}/cancel-booking?token=${tokens.cancelToken}`;
          modifyLink = `${baseUrl}/modify-booking?token=${tokens.modifyToken}`;
        } catch (error) {
          console.warn('Failed to generate booking tokens:', error);
        }
      }

      // Get additional booking details if booking_id is provided
      let service = 'Dinner';
      let bookingEndTime = '';
      let paymentStatus = '';
      let paymentAmount = '';

      if (bookingData.booking_id) {
        try {
          // Get booking details
          const { data: booking } = await supabase
            .from('bookings')
            .select('service, end_time, booking_time, duration_minutes')
            .eq('id', bookingData.booking_id)
            .single();

          if (booking) {
            service = booking.service || 'Dinner';
            
            // Calculate end time
            if (booking.end_time) {
              bookingEndTime = booking.end_time;
            } else if (booking.duration_minutes) {
              const [hours, minutes] = booking.booking_time.split(':').map(Number);
              const startTime = new Date();
              startTime.setHours(hours, minutes, 0, 0);
              const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60000);
              bookingEndTime = endTime.toTimeString().slice(0, 5);
            }
          }

          // Get payment information
          const { data: payment } = await supabase
            .from('booking_payments')
            .select('status, amount_cents')
            .eq('booking_id', bookingData.booking_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (payment) {
            paymentStatus = payment.status === 'succeeded' ? 'Paid' : 
                          payment.status === 'pending' ? 'Pending' : 
                          payment.status === 'failed' ? 'Failed' : '';
            if (payment.amount_cents) {
              paymentAmount = `$${(payment.amount_cents / 100).toFixed(2)}`;
            }
          }
        } catch (error) {
          console.warn('Failed to fetch additional booking details:', error);
        }
      }

      // Split guest name into first and last name
      const { firstName, lastName } = splitName(bookingData.guest_name);

      // Prepare template variables
      const templateVariables: TemplateVariables = {
        guest_name: bookingData.guest_name,
        first_name: firstName,
        last_name: lastName,
        venue_name: bookingData.venue_name,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        booking_end_time: bookingEndTime,
        service: service,
        party_size: bookingData.party_size,
        booking_reference: bookingData.booking_reference,
        payment_status: paymentStatus,
        payment_amount: paymentAmount,
        email_signature: emailSettings.email_signature || 'Best regards,\nYour Venue Team',
        cancel_link: cancelLink,
        modify_link: modifyLink,
      };

      // Try to use database template first (try 24h reminder, then 2h reminder, then fallback)
      let processedTemplate = await emailTemplateService.processTemplate(
        'booking_reminder_24h',
        profile.venue_id,
        templateVariables
      );

      if (!processedTemplate) {
        processedTemplate = await emailTemplateService.processTemplate(
          'booking_reminder_2h',
          profile.venue_id,
          templateVariables
        );
      }

      let subject: string;
      let html: string;

      if (processedTemplate) {
        subject = processedTemplate.subject;
        html = processedTemplate.html;
      } else {
        // Fallback to hardcoded template
        subject = `Booking Reminder - ${bookingData.venue_name}`;
        html = `
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
        `;
      }

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: guestEmail,
          subject,
          html,
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
