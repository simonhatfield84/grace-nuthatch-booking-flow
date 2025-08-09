
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  displayName: string;
  full_name?: string;
  avatar_url?: string;
  venue_id?: string;
}

export const useUserProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;
      
      // Get profile data and user role to find venue_id
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .eq('id', userId)
          .single(),
        supabase
          .from('user_roles')
          .select('venue_id')
          .eq('user_id', userId)
          .single()
      ]);
      
      if (profileResult.error) {
        console.error('Error fetching user profile:', profileResult.error);
        throw profileResult.error;
      }
      
      const data = profileResult.data;
      if (!data) return null;
      
      // Create display name with fallback logic
      let displayName = '';
      let full_name = '';
      
      if (data.first_name && data.last_name) {
        displayName = `${data.first_name} ${data.last_name}`;
        full_name = displayName;
      } else if (data.first_name) {
        displayName = data.first_name;
        full_name = data.first_name;
      } else if (data.last_name) {
        displayName = data.last_name;
        full_name = data.last_name;
      } else {
        displayName = data.email;
        full_name = data.email;
      }
      
      return {
        ...data,
        displayName,
        full_name,
        avatar_url: undefined,
        venue_id: roleResult.data?.venue_id || undefined
      };
    },
    enabled: !!userId,
  });
};

// Hook to get current user's profile
export const useCurrentUserProfile = () => {
  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  return useUserProfile(session?.user?.id);
};
