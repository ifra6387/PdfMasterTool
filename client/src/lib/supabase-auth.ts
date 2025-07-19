import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create single Supabase client instance to avoid multiple instances warning
let supabaseInstance: any = null;

export const supabase = (() => {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
})();

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

// Direct token processing function
export async function processOAuthTokens(): Promise<AuthUser | null> {
  if (!supabase) {
    console.error('Supabase not configured');
    return null;
  }

  // Check for OAuth tokens in URL fragment
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const tokenType = hashParams.get('token_type');
  const expiresIn = hashParams.get('expires_in');

  console.log('Processing OAuth tokens...', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    url: window.location.href
  });

  if (accessToken) {
    try {
      // Set the session using tokens from URL
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
        token_type: tokenType || 'bearer',
        expires_in: expiresIn ? parseInt(expiresIn) : 3600
      });

      if (error) {
        console.error('Error setting session:', error);
        return null;
      }

      if (data.session?.user) {
        const userData: AuthUser = {
          id: data.session.user.id,
          email: data.session.user.email || '',
          created_at: data.session.user.created_at || ''
        };

        // Save to localStorage
        localStorage.setItem('supabase_auth_user', JSON.stringify({
          user: userData,
          timestamp: Date.now()
        }));

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        console.log('OAuth session created successfully for:', userData.email);
        return userData;
      }
    } catch (error) {
      console.error('OAuth token processing error:', error);
    }
  }

  return null;
}

// Get current user from localStorage or Supabase
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!supabase) return null;

  try {
    // Check localStorage first
    const stored = localStorage.getItem('supabase_auth_user');
    if (stored) {
      const { user, timestamp } = JSON.parse(stored);
      // Check if stored session is less than 24 hours old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return user;
      } else {
        localStorage.removeItem('supabase_auth_user');
      }
    }

    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userData: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at || ''
      };

      localStorage.setItem('supabase_auth_user', JSON.stringify({
        user: userData,
        timestamp: Date.now()
      }));

      return userData;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }

  return null;
}

// Sign in with Google
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) {
    console.error('Supabase not configured');
    return;
  }

  try {
    console.log('Initiating Google OAuth...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('Google OAuth error:', error);
    }
  } catch (error) {
    console.error('Sign in error:', error);
  }
}

// Sign out
export async function signOut(): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase_auth_user');
    localStorage.removeItem('supabase_session');
    sessionStorage.clear();
    
    // Clear any remaining auth cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });

    console.log('User signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}