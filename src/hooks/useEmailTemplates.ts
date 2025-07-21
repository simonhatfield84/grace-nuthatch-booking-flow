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
  description?: string;
  is_active: boolean;
  auto_send: boolean;
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
}

export interface EmailTemplateUpdate {
  subject?: string;
  html_content?: string;
  text_content?: string;
  description?: string;
  is_active?: boolean;
  auto_send?: boolean;
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

      // Call the database function to create default templates
      const { error } = await supabase.rpc('create_default_email_templates', {
        p_venue_id: profile.venue_id
      });

      if (error) throw error;

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