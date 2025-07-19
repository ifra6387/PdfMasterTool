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
    if (!isConfigured) return; // Skip auth checks if Supabase not configured
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking session...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect to home page where user can sign in
  }

  return <>{children}</>;
}