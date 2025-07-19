import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { signOut, getCurrentUser, type AuthUser } from '@/lib/supabase-auth';
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
  Edit3,
  FileSpreadsheet,
  Globe,
  Scan,
  Droplets,
  Hash,
  Eye,
  Presentation
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const toolCategories = [
  {
    category: 'PDF Actions',
    description: 'Essential PDF operations',
    tools: [
      {
        id: 'merge',
        name: 'Merge PDFs',
        description: 'Combine multiple PDF files into one',
        icon: Merge,
        color: 'text-primary'
      },
      {
        id: 'split',
        name: 'Split PDF',
        description: 'Extract pages from your PDF',
        icon: Split,
        color: 'text-accent'
      },
      {
        id: 'compress',
        name: 'Compress PDF',
        description: 'Reduce PDF file size',
        icon: Archive,
        color: 'text-primary'
      }
    ]
  },
  {
    category: 'Conversions',
    description: 'Format conversion tools',
    tools: [
      {
        id: 'pdf-to-word',
        name: 'PDF ↔ Word',
        description: 'Convert between PDF and Word documents',
        icon: FileText,
        color: 'text-accent'
      },
      {
        id: 'word-to-pdf',
        name: 'Word to PDF',
        description: 'Convert Word documents to PDF',
        icon: FileText,
        color: 'text-primary'
      },
      {
        id: 'pdf-to-excel',
        name: 'PDF ↔ Excel',
        description: 'Convert between PDF and Excel files',
        icon: FileSpreadsheet,
        color: 'text-primary'
      },
      {
        id: 'excel-to-pdf',
        name: 'Excel to PDF',
        description: 'Convert Excel spreadsheets to PDF',
        icon: FileSpreadsheet,
        color: 'text-accent'
      },
      {
        id: 'powerpoint-to-pdf',
        name: 'PowerPoint to PDF',
        description: 'Convert PowerPoint presentations to PDF',
        icon: Presentation,
        color: 'text-primary'
      },
      {
        id: 'pdf-to-powerpoint',
        name: 'PDF to PowerPoint',
        description: 'Convert PDF to PowerPoint presentations',
        icon: Presentation,
        color: 'text-accent'
      },
      {
        id: 'pdf-to-jpg',
        name: 'PDF ↔ JPG',
        description: 'Convert PDF pages to images or vice versa',
        icon: FileImage,
        color: 'text-accent'
      },
      {
        id: 'pdf-to-html',
        name: 'PDF ↔ HTML',
        description: 'Convert between PDF and HTML format',
        icon: Globe,
        color: 'text-primary'
      }
    ]
  },
  {
    category: 'Page Tools',
    description: 'Page management and organization',
    tools: [
      {
        id: 'rotate',
        name: 'Add/Remove/Rotate Pages',
        description: 'Manage PDF pages - add, remove, or rotate',
        icon: RotateCw,
        color: 'text-accent'
      },
      {
        id: 'watermark',
        name: 'Watermark & Page Numbers',
        description: 'Add watermarks and page numbers',
        icon: Droplets,
        color: 'text-primary'
      },
      {
        id: 'edit',
        name: 'Edit PDF',
        description: 'Add text, shapes, images, and annotations',
        icon: Edit3,
        color: 'text-accent'
      }
    ]
  },
  {
    category: 'Security',
    description: 'Protect and secure your PDFs',
    tools: [
      {
        id: 'protect',
        name: 'Password-Protect PDF',
        description: 'Add password protection to your PDF',
        icon: Lock,
        color: 'text-accent'
      },
      {
        id: 'unlock',
        name: 'Unlock PDF',
        description: 'Remove password from PDF',
        icon: Unlock,
        color: 'text-primary'
      },
      {
        id: 'redact',
        name: 'Redact PDF',
        description: 'Remove sensitive information permanently',
        icon: Eye,
        color: 'text-accent'
      }
    ]
  },
  {
    category: 'Advanced',
    description: 'Professional PDF tools',
    tools: [
      {
        id: 'ocr-scan',
        name: 'OCR/Scan to PDF',
        description: 'Convert scanned images to searchable PDF',
        icon: Scan,
        color: 'text-primary'
      },
      {
        id: 'html-to-pdf',
        name: 'HTML to PDF',
        description: 'Convert web pages to PDF documents',
        icon: Globe,
        color: 'text-accent'
      },
      {
        id: 'sign',
        name: 'Sign PDF',
        description: 'Add digital signatures to your PDF',
        icon: Edit3,
        color: 'text-primary'
      }
    ]
  }
];

export default function Tools() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (!currentUser) {
          setLocation('/signin');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setLocation('/signin');
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [setLocation]);

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      await signOut();
      setUser(null);
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
      setLocation('/');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Please sign in to access PDF tools
          </h1>
          <Button onClick={() => setLocation('/signin')}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  const handleToolClick = (toolId: string) => {
    setLocation(`/tool/${toolId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      {/* Header */}
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm dark:shadow-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
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
          <h2 className="text-4xl md:text-5xl font-bold font-heading bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4">
            Choose Your Tool
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Select from our comprehensive suite of PDF tools to get started. Max file size: 20MB
          </p>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-center p-4 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-600/30 shadow-sm dark:shadow-slate-900/20 hover:bg-white/80 dark:hover:bg-slate-800/70 transition-all duration-300">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Auto-delete after 1 hour</span>
          </div>
          <div className="flex items-center justify-center p-4 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-600/30 shadow-sm dark:shadow-slate-900/20 hover:bg-white/80 dark:hover:bg-slate-800/70 transition-all duration-300">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Lightning fast processing</span>
          </div>
          <div className="flex items-center justify-center p-4 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-600/30 shadow-sm dark:shadow-slate-900/20 hover:bg-white/80 dark:hover:bg-slate-800/70 transition-all duration-300">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">100% secure and private</span>
          </div>
        </div>

        {/* Tool Categories */}
        <div className="space-y-12">
          {toolCategories.map((category) => (
            <div key={category.category}>
              <div className="mb-8">
                <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-2">{category.category}</h3>
                <p className="text-slate-600 dark:text-slate-400">{category.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className="group p-6 bg-white/70 hover:bg-white/85 dark:bg-slate-800/60 dark:hover:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-600/30 hover:border-slate-300/60 dark:hover:border-slate-500/40 shadow-sm dark:shadow-slate-900/20 hover:shadow-lg dark:hover:shadow-slate-900/40 hover:scale-[1.02] transition-all duration-300 text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm dark:shadow-slate-900/20">
                            <Icon className={`h-6 w-6 ${tool.color === 'text-primary' ? 'text-blue-600 dark:text-blue-400' : tool.color === 'text-accent' ? 'text-emerald-600 dark:text-emerald-400' : tool.color}`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold font-heading text-slate-900 dark:text-slate-100 mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                            {tool.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-300">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action Section */}
        <section className="py-16 mt-16 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/30 dark:to-slate-700/30 backdrop-blur-md rounded-3xl border border-slate-200/30 dark:border-slate-600/20 shadow-lg dark:shadow-slate-900/30">
          <div className="text-center max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-6">
              Start using all tools now — no installation required
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
              Upload your PDF and get started with any of our professional tools instantly
            </p>
            <Button 
              size="lg"
              onClick={() => document.querySelector('.group')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center px-8 py-4 text-lg font-heading font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl dark:shadow-slate-900/40 hover:scale-105"
            >
              Get Started
              <Upload className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        {/* Account Info Section */}
        <section className="py-16 mt-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-600/30 shadow-lg dark:shadow-slate-900/30 p-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center space-x-4 mb-6 md:mb-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-heading font-bold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-slate-100">
                      Account Information
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right mr-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Theme</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    {theme === "dark" ? (
                      <Sun className="w-6 h-6 text-amber-500" />
                    ) : (
                      <Moon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted by Millions Section */}
        <section className="py-16 mt-16 text-center bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-700/30 backdrop-blur-md rounded-3xl border border-slate-200/30 dark:border-slate-600/20 shadow-lg dark:shadow-slate-900/30">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-6">
              The PDF software trusted by millions of users
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              I Love Making PDF is your number one web app for editing PDF with ease. Enjoy all the tools you need to work efficiently with your digital documents while keeping your data safe and secure.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-sm px-4 py-2 rounded-full font-medium border border-emerald-200 dark:border-emerald-700 shadow-sm">
                ISO27001 Certified
              </span>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm px-4 py-2 rounded-full font-medium border border-blue-200 dark:border-blue-700 shadow-sm">
                Secure HTTPS
              </span>
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-sm px-4 py-2 rounded-full font-medium border border-indigo-200 dark:border-indigo-700 shadow-sm">
                PDF Association Member
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50 shadow-sm dark:shadow-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors duration-300 font-medium">About</a>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors duration-300 font-medium">Terms</a>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors duration-300 font-medium">Privacy</a>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <a href="#" className="hover:text-primary dark:hover:text-blue-400 transition-colors duration-300 font-medium">Contact</a>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            © 2025 I Love Making PDF. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}