
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userVenue: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userVenue, setUserVenue] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 AuthProvider initializing...');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state change:', { event, user: session?.user?.email });
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user venue when session changes
        if (session?.user) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('venue_id')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (error && error.code !== 'PGRST116') {
              console.error('❌ Error fetching user venue:', error);
              setUserVenue(null);
            } else if (data?.venue_id) {
              console.log('✅ User venue found:', data.venue_id);
              setUserVenue(data.venue_id);
            } else {
              console.log('⚠️ No venue found for user, checking if user is super admin');
              
              // Check if user is super admin
              const { data: adminData } = await supabase
                .from('platform_admins')
                .select('user_id')
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .maybeSingle();
              
              if (adminData) {
                console.log('✅ User is super admin');
                // For super admins, we'll use a default venue or handle differently
                setUserVenue('super_admin');
              } else {
                setUserVenue(null);
              }
            }
          } catch (error) {
            console.error('❌ Error in venue lookup:', error);
            setUserVenue(null);
          }
        } else {
          setUserVenue(null);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
      } else {
        console.log('📋 Initial session check:', { user: session?.user?.email });
      }
      setSession(session);
      setUser(session?.user ?? null);
      
      // Don't set loading to false here, let the auth state change handler do it
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('👋 Signing out user...');
    
    // Retry logic for sign out
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error(`❌ Sign out error (attempt ${retryCount + 1}):`, error);
          if (retryCount === maxRetries - 1) {
            // On final attempt, try to clear session manually
            console.log('🧹 Attempting manual session clear...');
            setSession(null);
            setUser(null);
            setUserVenue(null);
            localStorage.removeItem('supabase.auth.token');
            return;
          }
          throw error;
        }
        console.log('✅ Sign out successful');
        setUserVenue(null);
        return;
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying sign out in ${retryCount * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        } else {
          console.error('💥 Sign out failed after all retries, clearing session manually');
          // Clear session state manually as fallback
          setSession(null);
          setUser(null);
          setUserVenue(null);
          localStorage.removeItem('supabase.auth.token');
        }
      }
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    userVenue,
  };

  console.log('🔍 AuthProvider state:', { 
    hasUser: !!user, 
    userEmail: user?.email, 
    hasSession: !!session, 
    userVenue,
    loading 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
