
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import HomePage from '@/pages/HomePage';

export default function RootRedirect() {
  const { user, loading: authLoading } = useAuth();

  // Check if user is a platform admin
  const { data: isPlatformAdmin, isLoading: platformLoading } = useQuery({
    queryKey: ['is-platform-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('platform_admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      return !error && data;
    },
    enabled: !!user,
  });

  // Check if user has a venue profile
  const { data: hasVenueProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-venue-profile', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id, is_active')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();
      
      return !error && data && data.venue_id;
    },
    enabled: !!user,
  });

  if (authLoading || platformLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not authenticated, show homepage
  if (!user) {
    return <HomePage />;
  }

  // If platform admin, redirect to platform dashboard
  if (isPlatformAdmin) {
    return <Navigate to="/platform/dashboard" replace />;
  }

  // If venue admin, redirect to venue dashboard
  if (hasVenueProfile) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Default to homepage for other cases
  return <HomePage />;
}
