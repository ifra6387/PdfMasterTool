import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useSupabaseAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If not loading and no user, redirect to sign in
    if (!loading && !user) {
      setLocation('/signin');
    }
  }, [loading, user, setLocation]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render children (redirect will happen)
  if (!user) {
    return null;
  }

  // User is authenticated, render the protected component
  return <>{children}</>;
}