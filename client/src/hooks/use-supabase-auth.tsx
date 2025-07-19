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

    const initializeAuth = async () => {
      try {
        // Check if we have auth tokens in the URL (from OAuth redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          console.log('OAuth tokens found in URL, setting session...');
          
          // Set the session using the tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (error) {
            console.error('Error setting session from URL tokens:', error);
          } else if (data.session?.user) {
            console.log('Session set successfully from OAuth tokens');
            const userData = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              created_at: data.session.user.created_at || ''
            };
            
            setUser(userData);
            
            // Save session to localStorage
            localStorage.setItem('supabase_session', JSON.stringify({
              user: userData,
              session: data.session,
              timestamp: Date.now()
            }));
            
            // Clean up URL by removing hash parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to dashboard
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 100);
            
            setLoading(false);
            return;
          }
        }

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || ''
          };
          setUser(userData);
          
          // Save session to localStorage
          localStorage.setItem('supabase_session', JSON.stringify({
            user: userData,
            session: session,
            timestamp: Date.now()
          }));
        } else {
          // Check localStorage for session
          const storedSession = localStorage.getItem('supabase_session');
          if (storedSession) {
            try {
              const parsedSession = JSON.parse(storedSession);
              const isExpired = Date.now() - parsedSession.timestamp > 24 * 60 * 60 * 1000; // 24 hours
              
              if (!isExpired && parsedSession.user) {
                console.log('Using stored session');
                setUser(parsedSession.user);
              } else {
                localStorage.removeItem('supabase_session');
              }
            } catch (e) {
              localStorage.removeItem('supabase_session');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || ''
        };
        
        setUser(userData);
        
        // Save session to localStorage
        localStorage.setItem('supabase_session', JSON.stringify({
          user: userData,
          session: session,
          timestamp: Date.now()
        }));
        
        // Redirect to dashboard on successful sign in
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase_session');
        setUser(null);
      } else if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || ''
        };
        
        setUser(userData);
        localStorage.setItem('supabase_session', JSON.stringify({
          user: userData,
          session: session,
          timestamp: Date.now()
        }));
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
      // Use redirect-based OAuth with proper callback URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('OAuth sign in error:', error);
        throw error;
      }

      // Supabase will handle the redirect automatically
      console.log('OAuth initiated, waiting for redirect...');
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