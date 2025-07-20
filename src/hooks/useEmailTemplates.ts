import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface EmailTemplate {
  id: string;
  template_key: string;
  template_type: string;
  subject: string;
  html_content: string;
  text_content?: string;
  venue_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateCreate {
  template_key: string;
  template_type: string;
  subject: string;
  html_content: string;
  text_content?: string;
}

export interface EmailTemplateUpdate {
  subject?: string;
  html_content?: string;
  text_content?: string;
}

export const useEmailTemplates = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);

      // Get user's venue
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.venue_id) return;

      // Load venue-specific templates and platform templates
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .or(`venue_id.eq.${profile.venue_id},venue_id.is.null`)
        .order('template_key');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (template: EmailTemplateCreate) => {
    try {
      // Get user's venue
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.venue_id) throw new Error('Venue not found');

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          ...template,
          venue_id: profile.venue_id,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [...prev, data]);
      toast({
        title: "Template Created",
        description: "Email template created successfully"
      });

      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create email template",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: EmailTemplateUpdate) => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: "Template Updated",
        description: "Email template updated successfully"
      });

      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update email template",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Template Deleted",
        description: "Email template deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete email template",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getTemplate = (templateKey: string) => {
    return templates.find(t => t.template_key === templateKey);
  };

  const createDefaultTemplates = async () => {
    try {
      // Get user's venue
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.venue_id) throw new Error('Venue not found');

      const { data: venue } = await supabase
        .from('venues')
        .select('name')
        .eq('id', profile.venue_id)
        .single();

      const venueName = venue?.name || 'Your Venue';

      const defaultTemplates = [
        {
          template_key: 'booking_confirmation',
          template_type: 'venue',
          subject: `Booking Confirmation - ${venueName}`,
          html_content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
                <p style="color: #64748b; margin: 5px 0;">Booking Confirmation</p>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
                <h2 style="color: #1e293b; margin-top: 0;">Your booking is confirmed!</h2>
                <p>Dear {{guest_name}},</p>
                <p>Thank you for your booking at {{venue_name}}.</p>
                
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #ea580c;">Booking Details</h3>
                  <p><strong>Reference:</strong> {{booking_reference}}</p>
                  <p><strong>Date:</strong> {{booking_date}}</p>
                  <p><strong>Time:</strong> {{booking_time}}</p>
                  <p><strong>Party Size:</strong> {{party_size}}</p>
                  <p><strong>Venue:</strong> {{venue_name}}</p>
                </div>
                
                <p>We look forward to seeing you!</p>
              </div>
              
              <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
                <p>{{email_signature}}</p>
              </div>
            </div>
          `,
          venue_id: profile.venue_id,
        },
        {
          template_key: 'booking_reminder',
          template_type: 'venue',
          subject: `Booking Reminder - ${venueName}`,
          html_content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
                <p style="color: #64748b; margin: 5px 0;">Booking Reminder</p>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
                <h2 style="color: #1e293b; margin-top: 0;">Don't forget your booking!</h2>
                <p>Dear {{guest_name}},</p>
                <p>This is a friendly reminder about your upcoming booking at {{venue_name}}.</p>
                
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #ea580c;">Booking Details</h3>
                  <p><strong>Reference:</strong> {{booking_reference}}</p>
                  <p><strong>Date:</strong> {{booking_date}}</p>
                  <p><strong>Time:</strong> {{booking_time}}</p>
                  <p><strong>Party Size:</strong> {{party_size}}</p>
                  <p><strong>Venue:</strong> {{venue_name}}</p>
                </div>
                
                <p>We look forward to seeing you!</p>
              </div>
              
              <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
                <p>{{email_signature}}</p>
              </div>
            </div>
          `,
          venue_id: profile.venue_id,
        }
      ];

      for (const template of defaultTemplates) {
        // Check if template already exists
        const existing = templates.find(t => t.template_key === template.template_key && t.venue_id === profile.venue_id);
        if (!existing) {
          await supabase.from('email_templates').insert(template);
        }
      }

      // Reload templates
      await loadTemplates();

      toast({
        title: "Default Templates Created",
        description: "Default email templates have been created for your venue"
      });
    } catch (error) {
      console.error('Error creating default templates:', error);
      toast({
        title: "Error",
        description: "Failed to create default templates",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  return {
    templates,
    isLoading,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    createDefaultTemplates,
  };
};