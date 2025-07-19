import { useState } from "react";
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Moon, Sun, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

export default function LoginStandalone() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signInWithOAuth, isConfigured } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError('Authentication service not configured');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        setError('Authentication service not configured');
        return;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || 'Invalid email or password');
      } else if (data.user && data.session) {
        // Save session to localStorage
        localStorage.setItem('supabase_session', JSON.stringify({
          user: data.user,
          session: data.session,
          timestamp: Date.now()
        }));
        
        // Redirect to dashboard (tools) page
        setLocation('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google') => {
    if (!isConfigured) {
      setError('Authentication service not configured');
      return;
    }

    setOauthLoading(true);
    setError(null);

    try {
      await signInWithOAuth(provider);
      // If successful, redirect to dashboard
      setLocation('/dashboard');
    } catch (err: any) {
      console.error('OAuth error:', err);
      if (err.message?.includes('popup')) {
        setError('Please allow popups for this site and try again');
      } else if (err.message?.includes('iframe')) {
        setError('Please open this app in a new tab to use Google Sign-In');
      } else {
        setError(err.message || 'Google sign in failed. Please try again.');
      }
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="flex items-center space-x-2 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="rounded-full p-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300 shadow-lg dark:shadow-slate-900/40"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-500" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-600/30 shadow-xl dark:shadow-slate-900/40">
          <CardHeader className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold font-heading mb-2">
              Welcome Back
            </CardTitle>
            <p className="text-muted-foreground">
              Sign in to access your PDF tools
            </p>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 backdrop-blur-sm">
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* OAuth Buttons */}
            {isConfigured && (
              <div className="space-y-4 mb-6">
                <Button
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={oauthLoading}
                  className="w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 shadow-md"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {oauthLoading ? "Opening Google Sign-In..." : "Continue with Google"}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with email</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 font-heading"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button 
                  onClick={() => setLocation('/signup')}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}