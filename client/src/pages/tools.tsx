import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useLocation } from 'wouter';
import { 
  FileText, 
  Shield, 
  Zap, 
  Moon, 
  Sun, 
  LogOut,
  Split,
  Merge,
  Archive,
  FileImage,
  RotateCw,
  Lock,
  Unlock,
  FileCheck,
  Files,
  ScanLine,
  Download,
  Upload,
  Edit3
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pdfTools = [
  {
    id: 'merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one',
    icon: Merge,
    color: 'text-blue-600'
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Extract pages from your PDF',
    icon: Split,
    color: 'text-green-600'
  },
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size',
    icon: Archive,
    color: 'text-orange-600'
  },
  {
    id: 'convert',
    name: 'PDF to JPG',
    description: 'Convert PDF pages to images',
    icon: FileImage,
    color: 'text-purple-600'
  },
  {
    id: 'rotate',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages',
    icon: RotateCw,
    color: 'text-indigo-600'
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    description: 'Add password to your PDF',
    icon: Lock,
    color: 'text-red-600'
  },
  {
    id: 'unlock',
    name: 'Unlock PDF',
    description: 'Remove password from PDF',
    icon: Unlock,
    color: 'text-yellow-600'
  },
  {
    id: 'sign',
    name: 'Sign PDF',
    description: 'Add signature to your PDF',
    icon: Edit3,
    color: 'text-teal-600'
  },
  {
    id: 'watermark',
    name: 'Watermark PDF',
    description: 'Add watermark to your PDF',
    icon: ScanLine,
    color: 'text-pink-600'
  }
];

export default function Tools() {
  const { user, logout } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await logout();
    setLocation('/');
  };

  const handleToolClick = (toolId: string) => {
    setLocation(`/tool/${toolId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-white/20 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
                I Love Making PDF
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Welcome, {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="rounded-full p-2"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent mb-4">
            Choose Your Tool
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Select from our comprehensive suite of PDF tools to get started
          </p>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-center p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
            <Shield className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-delete after 1 hour</span>
          </div>
          <div className="flex items-center justify-center p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Lightning fast processing</span>
          </div>
          <div className="flex items-center justify-center p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
            <Lock className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">100% secure and private</span>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className="group p-6 bg-white/70 hover:bg-white/90 dark:bg-slate-800/70 dark:hover:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/50 hover:border-white/40 dark:hover:border-slate-600/50 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] text-left"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Icon className={`h-6 w-6 ${tool.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}