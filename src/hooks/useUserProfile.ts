
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  displayName: string;
}

export const useUserProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
      
      if (!data) return null;
      
      // Create display name with fallback logic
      let displayName = '';
      if (data.first_name && data.last_name) {
        displayName = `${data.first_name} ${data.last_name}`;
      } else if (data.first_name) {
        displayName = data.first_name;
      } else if (data.last_name) {
        displayName = data.last_name;
      } else {
        displayName = data.email;
      }
      
      return {
        ...data,
        displayName
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
