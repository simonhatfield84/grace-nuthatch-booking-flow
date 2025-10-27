import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { V5BookingWidget } from '../components/V5BookingWidget';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function V5WidgetPreviewPage() {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  const { user } = useAuth();
  
  // Check if user is admin of this venue
  const { data: canAccess, isLoading } = useQuery({
    queryKey: ['can-preview-v5', venueSlug, user?.id],
    queryFn: async () => {
      if (!user || !venueSlug) return false;
      
      const { data: venue } = await supabase
        .from('venues_public')
        .select('id')
        .eq('slug', venueSlug)
        .single();
      
      if (!venue) return false;
      
      const { data, error } = await supabase
        .rpc('is_admin', { _user_id: user.id, _venue_id: venue.id });
      
      return data === true && !error;
    },
    enabled: !!user && !!venueSlug
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-6 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to preview this booking widget.
          </p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-yellow-50 border-b border-yellow-200 py-3 px-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-yellow-900">
            <span className="font-semibold">🔍 Preview Mode</span> - This is how your V5 booking widget appears to guests
          </p>
        </div>
      </div>
      {venueSlug && <V5BookingWidget venueSlug={venueSlug} />}
    </div>
  );
}
