import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface SupabaseAuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<void>;
  isConfigured: boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  signInWithOAuth: async () => {},
  isConfigured: false,
});

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || ''
          });
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || ''
        };
        
        // Save session to localStorage
        localStorage.setItem('supabase_session', JSON.stringify({
          user: userData,
          session: session,
          timestamp: Date.now()
        }));
        
        setUser(userData);
      } else {
        localStorage.removeItem('supabase_session');
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    if (!supabase) return;
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all authentication data
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Clear any cookies if they exist
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Update state
      setUser(null);
      
      console.log('User successfully logged out');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear local state even if remote logout fails
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github' | 'discord') => {
    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }

    try {
      // Use popup-based OAuth to avoid iframe restrictions
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Force popup instead of redirect to avoid iframe issues
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('OAuth sign in error:', error);
        throw error;
      }

      // For popup-based auth, we need to handle the response differently
      if (data?.url) {
        // Open OAuth URL in a popup window
        const popup = window.open(
          data.url,
          'oauth-popup',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the popup to close or receive a message
        return new Promise((resolve, reject) => {
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              // Check if authentication was successful
              supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
                if (sessionError) {
                  reject(sessionError);
                } else if (sessionData.session) {
                  // Update local state
                  setUser(sessionData.session.user);
                  // Save to localStorage
                  localStorage.setItem('supabase_session', JSON.stringify({
                    user: sessionData.session.user,
                    session: sessionData.session,
                    timestamp: Date.now()
                  }));
                  resolve(sessionData.session);
                } else {
                  reject(new Error('Authentication was cancelled or failed'));
                }
              });
            }
          }, 1000);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkClosed);
            if (popup && !popup.closed) {
              popup.close();
            }
            reject(new Error('Authentication timeout'));
          }, 300000);
        });
      }
    } catch (error) {
      console.error('OAuth sign in failed:', error);
      throw error;
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{ user, loading, logout, signInWithOAuth, isConfigured }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  return useContext(SupabaseAuthContext);
}