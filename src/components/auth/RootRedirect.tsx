
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import HomePage from '@/pages/HomePage';

export default function RootRedirect() {
  const { user, loading: authLoading } = useAuth();

  console.log('🔄 RootRedirect - User:', user?.email, 'Loading:', authLoading);

  // Check if user is a platform admin
  const { data: isPlatformAdmin, isLoading: platformLoading } = useQuery({
    queryKey: ['is-platform-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      console.log('🔍 Checking platform admin status for:', user.email);
      const { data, error } = await supabase
        .from('platform_admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      console.log('👑 Platform admin check result:', { data, error });
      return !error && data;
    },
    enabled: !!user,
  });

  // Check if user has a venue profile
  const { data: hasVenueProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-venue-profile', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      console.log('🏢 Checking venue profile for:', user.email);
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id, is_active')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();
      
      console.log('🏢 Venue profile check result:', { data, error });
      return !error && data && data.venue_id;
    },
    enabled: !!user,
  });

  if (authLoading || platformLoading || profileLoading) {
    console.log('⏳ Loading states - Auth:', authLoading, 'Platform:', platformLoading, 'Profile:', profileLoading);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not authenticated, show homepage
  if (!user) {
    console.log('❌ No authenticated user, showing homepage');
    return <HomePage />;
  }

  // If platform admin, redirect to platform dashboard
  if (isPlatformAdmin) {
    console.log('👑 Platform admin detected, redirecting to platform dashboard');
    return <Navigate to="/platform/dashboard" replace />;
  }

  // If venue admin, redirect to dashboard (FIXED: was /admin/dashboard)
  if (hasVenueProfile) {
    console.log('🏢 Venue user detected, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Default to homepage for other cases
  console.log('🏠 Unknown user type, showing homepage');
  return <HomePage />;
}
