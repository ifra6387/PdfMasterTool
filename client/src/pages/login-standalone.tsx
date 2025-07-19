import { useState } from "react";
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Moon, Sun, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export default function LoginStandalone() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Authentication service not configured');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
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
        
        // Redirect to dashboard/tools
        setLocation('/tools');
      }
    } catch (err) {
      setError('An unexpected error occurred during sign in');
    } finally {
      setLoading(false);
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