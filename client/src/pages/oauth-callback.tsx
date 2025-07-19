import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { user, loading } = useSupabaseAuth();

  useEffect(() => {
    // Handle OAuth callback
    const handleCallback = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('Supabase not configured');
          setLocation('/signin?error=config');
          return;
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get session from URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth callback error:', error);
          setLocation('/signin?error=oauth');
          return;
        }

        if (data.session) {
          // Save session to localStorage
          localStorage.setItem('supabase_session', JSON.stringify({
            user: data.session.user,
            session: data.session,
            timestamp: Date.now()
          }));
          
          // Redirect to dashboard
          setLocation('/dashboard');
        } else {
          // No session, redirect to sign in
          setLocation('/signin');
        }
      } catch (error) {
        console.error('OAuth callback processing error:', error);
        setLocation('/signin?error=callback');
      }
    };

    // Only process if we don't have a user yet
    if (!loading && !user) {
      handleCallback();
    } else if (!loading && user) {
      // User already authenticated, go to dashboard
      setLocation('/dashboard');
    }
  }, [loading, user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-600/30 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Completing Sign In...
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center">
            We're processing your authentication. You'll be redirected shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}