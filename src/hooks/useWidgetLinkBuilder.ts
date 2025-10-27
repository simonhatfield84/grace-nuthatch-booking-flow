import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WidgetLinkParams {
  variant?: 'standard' | 'serviceFirst';
  party?: number;
  date?: string; // YYYY-MM-DD
  service?: string; // UUID
}

export interface WidgetLinkUTM {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface WidgetLink {
  id: string;
  venue_id: string;
  slug: string;
  params: WidgetLinkParams;
  utm: WidgetLinkUTM;
  created_at: string;
  created_by: string | null;
  click_count: number;
  last_clicked_at: string | null;
}

// Generate 8-char slug
function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export function useWidgetLinkBuilder(venueId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query: Fetch all links for this venue
  const { data: links, isLoading } = useQuery({
    queryKey: ['widget-links', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_link_builder')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WidgetLink[];
    },
    enabled: !!venueId
  });

  // Mutation: Create new link
  const createLink = useMutation({
    mutationFn: async (input: {
      params: WidgetLinkParams;
      utm: WidgetLinkUTM;
    }) => {
      let slug = generateSlug();
      let attempts = 0;
      const maxAttempts = 3;
      
      // Retry if slug collision occurs
      while (attempts < maxAttempts) {
        const { data, error } = await supabase
          .from('venue_link_builder')
          .insert({
            venue_id: venueId,
            slug,
            params: input.params as any,
            utm: input.utm as any,
            created_by: user?.id || null
          })
          .select()
          .single();
        
        // Success
        if (!error) return data;
        
        // Slug collision, retry with new slug
        if (error.code === '23505') {
          slug = generateSlug();
          attempts++;
          continue;
        }
        
        // Other error
        throw error;
      }
      
      throw new Error('Failed to generate unique slug after multiple attempts');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-links', venueId] });
    }
  });

  // Mutation: Delete link
  const deleteLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('venue_link_builder')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-links', venueId] });
    }
  });

  return {
    links: links || [],
    isLoading,
    createLink,
    deleteLink
  };
}
