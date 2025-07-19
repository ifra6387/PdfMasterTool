import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/" }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const { user, loading, isConfigured } = useSupabaseAuth();

  useEffect(() => {
    if (!isConfigured) {
      // Check localStorage for session if Supabase not configured
      const savedSession = localStorage.getItem('supabase_session');
      if (savedSession && requireAuth) {
        try {
          const session = JSON.parse(savedSession);
          // Check if session is not expired (24 hours)
          if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('supabase_session');
            setLocation(redirectTo);
          }
        } catch {
          localStorage.removeItem('supabase_session');
          setLocation(redirectTo);
        }
      } else if (!savedSession && requireAuth) {
        setLocation(redirectTo);
      }
      return;
    }
    
    if (loading) return;

    if (requireAuth && !user) {
      setLocation(redirectTo);
    } else if (!requireAuth && user && redirectTo === "/") {
      // If user is logged in and trying to access a non-auth page that doesn't require auth, allow it
      return;
    }
  }, [loading, user, requireAuth, redirectTo, setLocation, isConfigured]);

  if (!isConfigured) {
    return <>{children}</>; // Allow access if Supabase not configured
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Checking session...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect to home page where user can sign in
  }

  return <>{children}</>;
}