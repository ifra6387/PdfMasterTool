import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            404 - Page Not Found
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Available pages: <Link href="/" className="text-blue-600 hover:underline">Tools Home</Link>, 
              <Link href="/signin" className="text-blue-600 hover:underline"> Sign In</Link>, 
              <Link href="/dashboard" className="text-blue-600 hover:underline"> Dashboard</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
