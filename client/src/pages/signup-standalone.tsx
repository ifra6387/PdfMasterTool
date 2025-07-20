import { useState } from "react";
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Moon, Sun, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function SignUpStandalone() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);

    try {
      // Simple demo signup - any valid input works
      if (email && password) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSuccess('Account created successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          setLocation('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    // Direct access to dashboard without authentication
    setLocation('/dashboard');
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
              Create Account
            </CardTitle>
            <p className="text-muted-foreground">
              Join thousands of users who love our PDF tools
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

            {success && (
              <Alert className="mb-4 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 backdrop-blur-sm">
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Demo Access Button */}
            <div className="mb-6">
              <Button
                onClick={handleDemoAccess}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 transition-all duration-300 shadow-lg"
              >
                Try Demo (No Registration Required)
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                  Or create account with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-300 dark:border-slate-600 focus:border-primary dark:focus:border-primary"
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
                  placeholder="Create a password"
                  className="mt-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-300 dark:border-slate-600 focus:border-primary dark:focus:border-primary"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="mt-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-300 dark:border-slate-600 focus:border-primary dark:focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium py-3 transition-all duration-300 shadow-lg"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
              </span>
              <Button
                variant="link"
                onClick={() => setLocation('/signin')}
                className="text-sm text-primary hover:text-primary/80 p-0 h-auto font-medium"
              >
                Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}