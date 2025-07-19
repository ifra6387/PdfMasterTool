import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth-modal";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useLocation } from 'wouter';
import { FileText, Shield, Zap, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, loading } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Redirect to tools if already authenticated
  if (user) {
    setLocation('/tools');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="rounded-full p-3 bg-white/20 hover:bg-white/30 dark:bg-slate-800/40 dark:hover:bg-slate-700/50 backdrop-blur-sm"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent mb-6">
            All-in-One PDF Toolkit
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Merge, compress, convert PDF files — secure, fast, and free.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/50">
              <Shield className="h-10 w-10 text-green-500 mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Secure</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Files auto-delete after processing</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/50">
              <Zap className="h-10 w-10 text-yellow-500 mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Fast</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Lightning-quick processing</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/50">
              <FileText className="h-10 w-10 text-blue-500 mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Complete</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">All PDF tools in one place</p>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            onClick={() => setAuthModalOpen(true)}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {loading ? 'Loading...' : 'Sign In to Get Started'}
          </Button>

          {/* Additional Info */}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-6">
            No credit card required • Start using immediately
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
