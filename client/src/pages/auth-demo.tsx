import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useLocation } from 'wouter';
import { FileText } from 'lucide-react';

export default function AuthDemo() {
  const { user, signInWithGoogle, signOut } = useSupabaseAuth();
  const [, setLocation] = useLocation();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const goToDashboard = () => {
    setLocation('/dashboard');
  };

  const goHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-mint-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle className="text-2xl font-heading">Authentication Demo</CardTitle>
          <CardDescription>
            Test the Supabase authentication system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ Signed in as: {user.email}
                </p>
              </div>
              <div className="space-y-2">
                <Button onClick={goToDashboard} className="w-full bg-blue-600 hover:bg-blue-700">
                  Go to PDF Tools
                </Button>
                <Button onClick={goHome} variant="outline" className="w-full">
                  Go to Home
                </Button>
                <Button onClick={handleSignOut} variant="destructive" className="w-full">
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button 
                onClick={handleGoogleSignIn} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign in with Google
              </Button>
              <Button onClick={goHome} variant="outline" className="w-full">
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}