import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { unlayerTemplateService } from "@/services/unlayerTemplateService";

export interface EmailTemplate {
  id: string;
  template_key: string;
  template_type: string;
  subject: string;
  html_content: string;
  text_content?: string;
  venue_id?: string;
  description?: string;
  is_active: boolean;
  auto_send: boolean;
  design_json?: any;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateCreate {
  template_key: string;
  template_type: string;
  subject: string;
  html_content: string;
  text_content?: string;
  description?: string;
  is_active?: boolean;
  auto_send?: boolean;
  design_json?: any;
}

export interface EmailTemplateUpdate {
  subject?: string;
  html_content?: string;
  text_content?: string;
  description?: string;
  is_active?: boolean;
  auto_send?: boolean;
  design_json?: any;
}

export const useEmailTemplates = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);

      // Load venue-specific templates only
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
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
      // Get user's venue from profile
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
      // Get user's venue from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.venue_id) throw new Error('Venue not found');

      // Get venue name for template customization
      const { data: venue } = await supabase
        .from('venues')
        .select('name')
        .eq('id', profile.venue_id)
        .single();

      const venueName = venue?.name || 'Your Venue';

      // Define template configurations
      const templateConfigs = [
        {
          key: 'booking_confirmation',
          name: 'Booking Confirmation',
          subject: `Booking Confirmation - ${venueName}`,
          description: 'Sent immediately after a booking is confirmed',
          auto_send: true
        },
        {
          key: 'booking_reminder_24h',
          name: '24-Hour Reminder',
          subject: `Booking Reminder - Tomorrow at ${venueName}`,
          description: 'Sent 24 hours before the booking',
          auto_send: false
        },
        {
          key: 'booking_reminder_2h',
          name: '2-Hour Reminder',
          subject: `Booking Reminder - In 2 Hours at ${venueName}`,
          description: 'Sent 2 hours before the booking',
          auto_send: false
        },
        {
          key: 'booking_cancelled',
          name: 'Booking Cancelled',
          subject: `Booking Cancelled - ${venueName}`,
          description: 'Sent when a booking is cancelled',
          auto_send: true
        },
        {
          key: 'booking_modified',
          name: 'Booking Modified',
          subject: `Booking Modified - ${venueName}`,
          description: 'Sent when a booking is modified',
          auto_send: true
        },
        {
          key: 'booking_no_show',
          name: 'No-Show Follow-up',
          subject: `We missed you - ${venueName}`,
          description: 'Sent when a booking is marked as no-show',
          auto_send: false
        },
        {
          key: 'walk_in_confirmation',
          name: 'Walk-in Confirmation',
          subject: `Thanks for visiting - ${venueName}`,
          description: 'Sent when a walk-in visit is recorded',
          auto_send: false
        }
      ];

      // Create templates with simple Unlayer designs
      for (const config of templateConfigs) {
        const design = unlayerTemplateService.createSimpleDesign(config.key);
        const html = unlayerTemplateService.generateSimpleHTML(config.key);

        await supabase
          .from('email_templates')
          .upsert({
            venue_id: profile.venue_id,
            template_key: config.key,
            template_type: 'venue',
            subject: config.subject,
            html_content: html,
            description: config.description,
            is_active: true,
            auto_send: config.auto_send,
            design_json: design
          }, {
            onConflict: 'venue_id,template_key'
          });
      }

      // Reload templates
      await loadTemplates();

      toast({
        title: "Templates Created",
        description: "Simple email templates have been created with visual editor support"
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

  const toggleTemplateActive = async (id: string, isActive: boolean) => {
    try {
      await updateTemplate(id, { is_active: isActive });
    } catch (error) {
      console.error('Error toggling template status:', error);
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
    toggleTemplateActive,
  };
};
