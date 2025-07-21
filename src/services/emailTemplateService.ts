import { supabase } from "@/integrations/supabase/client";

export interface TemplateVariables {
  guest_name: string;
  venue_name: string;
  booking_date: string;
  booking_time: string;
  party_size: string;
  booking_reference: string;
  email_signature: string;
  cancel_link?: string;
  modify_link?: string;
  [key: string]: string;
}

export const emailTemplateService = {
  /**
   * Replace template variables in content with actual values
   */
  replaceVariables(content: string, variables: TemplateVariables): string {
    let processedContent = content;
    
    // Replace all {{variable}} placeholders with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, value || '');
    });
    
    return processedContent;
  },

  /**
   * Get template by key for a specific venue
   */
  async getTemplate(templateKey: string, venueId: string) {
    try {
      // Try to get venue-specific template first, then fall back to platform template
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('is_active', true) // Only get active templates
        .or(`venue_id.eq.${venueId},venue_id.is.null`)
        .order('venue_id', { ascending: false }) // Prioritize venue-specific over platform
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  },

  /**
   * Generate secure booking tokens for cancel/modify links
   */
  async generateBookingTokens(bookingId: number): Promise<{ cancelToken: string; modifyToken: string }> {
    try {
      // Generate cancel token
      const { data: cancelData, error: cancelError } = await supabase
        .from('booking_tokens')
        .insert({
          booking_id: bookingId,
          token_type: 'cancel',
          token: await this.generateToken(),
        })
        .select('token')
        .single();

      if (cancelError) throw cancelError;

      // Generate modify token
      const { data: modifyData, error: modifyError } = await supabase
        .from('booking_tokens')
        .insert({
          booking_id: bookingId,
          token_type: 'modify',
          token: await this.generateToken(),
        })
        .select('token')
        .single();

      if (modifyError) throw modifyError;

      return {
        cancelToken: cancelData.token,
        modifyToken: modifyData.token,
      };
    } catch (error) {
      console.error('Error generating booking tokens:', error);
      throw error;
    }
  },

  /**
   * Generate a secure token
   */
  async generateToken(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_booking_token');
    if (error) throw error;
    return data;
  },

  /**
   * Process template content with variables and return ready-to-send email
   */
  async processTemplate(
    templateKey: string, 
    venueId: string, 
    variables: TemplateVariables
  ): Promise<{ subject: string; html: string; text?: string } | null> {
    try {
      const template = await this.getTemplate(templateKey, venueId);
      
      if (!template) {
        console.warn(`Template ${templateKey} not found for venue ${venueId}`);
        return null;
      }

      return {
        subject: this.replaceVariables(template.subject, variables),
        html: this.replaceVariables(template.html_content, variables),
        text: template.text_content ? this.replaceVariables(template.text_content, variables) : undefined,
      };
    } catch (error) {
      console.error('Error processing template:', error);
      return null;
    }
  },

  /**
   * Get available template variables for documentation
   */
  getAvailableVariables(): { [key: string]: string } {
    return {
      guest_name: "Guest's full name",
      venue_name: "Name of the venue",
      booking_date: "Date of the booking",
      booking_time: "Time of the booking",
      party_size: "Number of guests",
      booking_reference: "Unique booking reference",
      email_signature: "Venue's email signature",
      cancel_link: "Link to cancel the booking",
      modify_link: "Link to modify the booking",
    };
  },

  /**
   * Validate template content for required variables
   */
  validateTemplate(content: string, requiredVariables: string[]): { isValid: boolean; missingVariables: string[] } {
    const missingVariables: string[] = [];
    
    requiredVariables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      if (!regex.test(content)) {
        missingVariables.push(variable);
      }
    });

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
    };
  },

  /**
   * Preview template with sample data
   */
  previewTemplate(content: string): string {
    const sampleData: TemplateVariables = {
      guest_name: "John Smith",
      venue_name: "The Nuthatch",
      booking_date: "Friday, December 25th, 2024",
      booking_time: "7:00 PM",
      party_size: "4 guests",
      booking_reference: "BK-2024-123456",
      email_signature: "Best regards,\nThe Nuthatch Team",
      cancel_link: "#cancel",
      modify_link: "#modify",
    };

    return this.replaceVariables(content, sampleData);
  }
};