import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthGuard } from '@/components/auth-guard';
import { useLocation } from 'wouter';
import { LogOut, User, Shield, Clock, Database } from 'lucide-react';

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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!supabase) return;

    // Get current user
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || ''
        });
      }
    };

    getCurrentUser();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showMessage('error', error.message);
      } else {
        showMessage('success', 'Logged out successfully!');
        // Clear user state
        setUser(null);
        // Redirect to auth page after a brief delay
        setTimeout(() => {
          setLocation('/auth-demo');
        }, 1000);
      }
    } catch (error) {
      showMessage('error', 'An unexpected error occurred during logout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Welcome to your secure dashboard
                </p>
              </div>
              <Button 
                onClick={handleLogout} 
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{loading ? 'Logging out...' : 'Logout'}</span>
              </Button>
            </div>
          </div>

          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : 'border-green-200 bg-green-50 dark:bg-green-900/20'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* User Info Card */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-500" />
                  <span>User Profile</span>
                </CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email:</p>
                      <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">User ID:</p>
                      <p className="text-gray-600 dark:text-gray-400 font-mono text-xs break-all">{user.id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Account Created:</p>
                      <p className="text-gray-600 dark:text-gray-400">{new Date(user.created_at).toLocaleString()}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Security Status</span>
                </CardTitle>
                <CardDescription>Authentication and security info</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900 dark:text-white">Authenticated</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900 dark:text-white">Session Active</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-900 dark:text-white">Connected to Supabase</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/')}>
              <CardHeader>
                <CardTitle className="text-lg">PDF Tools</CardTitle>
                <CardDescription>Access all PDF manipulation tools</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Merge, split, compress, and convert PDF files with our comprehensive toolkit.
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/auth-demo')}>
              <CardHeader>
                <CardTitle className="text-lg">Auth Demo</CardTitle>
                <CardDescription>View authentication system</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explore the Supabase authentication system and its features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Session Info</span>
                </CardTitle>
                <CardDescription>Current session details</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your session is active and secure. Logout when finished for security.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This dashboard is protected by Supabase authentication
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}