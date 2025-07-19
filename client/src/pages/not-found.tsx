import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { FileX } from 'lucide-react';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-mint-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center">
        <FileX className="h-24 w-24 text-gray-400 mx-auto mb-8" />
        <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Button 
          onClick={() => setLocation('/')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
}