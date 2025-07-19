import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { user, loading } = useSupabaseAuth();

  useEffect(() => {
    // Wait for the auth hook to process the OAuth tokens
    const handleRedirect = () => {
      if (!loading) {
        if (user) {
          // User authenticated successfully
          setTimeout(() => setLocation('/dashboard'), 1000);
        } else {
          // Authentication failed
          setTimeout(() => setLocation('/signin?error=oauth'), 2000);
        }
      }
    };

    // Check URL for error parameters
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      setTimeout(() => setLocation('/signin?error=oauth'), 2000);
      return;
    }

    handleRedirect();
  }, [loading, user, setLocation]);

  // Show different states based on authentication status
  const getContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Completing Sign In...
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center">
            Processing your Google authentication...
          </p>
        </>
      );
    } else if (user) {
      return (
        <>
          <CheckCircle className="h-8 w-8 text-green-500" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Sign In Successful!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center">
            Welcome back! Redirecting to your dashboard...
          </p>
        </>
      );
    } else {
      return (
        <>
          <XCircle className="h-8 w-8 text-red-500" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Sign In Failed
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center">
            Something went wrong. Redirecting back to sign in...
          </p>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-600/30 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          {getContent()}
        </CardContent>
      </Card>
    </div>
  );
}