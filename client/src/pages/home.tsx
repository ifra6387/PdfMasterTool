import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { 
  FileText, 
  Shield, 
  Zap, 
  Moon, 
  Sun, 
  Upload, 
  Cog, 
  Download, 
  Users, 
  Lock, 
  Star, 
  Github, 
  Linkedin, 
  Twitter, 
  CheckCircle, 
  ArrowRight, 
  Merge, 
  Split, 
  Archive, 
  FileSpreadsheet, 
  Globe, 
  Scan,
  RotateCw,
  Eye,
  Unlock,
  Droplets
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const handleGetStarted = () => {
    // Direct access to dashboard without authentication
    setLocation('/dashboard');
  };

  const toolShowcase = [
    { name: 'Merge PDFs', icon: Merge, color: 'text-primary' },
    { name: 'Split PDF', icon: Split, color: 'text-accent' },
    { name: 'Compress PDF', icon: Archive, color: 'text-primary' },
    { name: 'PDF ↔ Word', icon: FileText, color: 'text-accent' },
    { name: 'PDF ↔ Excel', icon: FileSpreadsheet, color: 'text-primary' },
    { name: 'PDF ↔ JPG', icon: FileText, color: 'text-accent' },
    { name: 'PDF ↔ HTML', icon: Globe, color: 'text-primary' },
    { name: 'OCR/Scan', icon: Scan, color: 'text-accent' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="rounded-full p-3 bg-white/30 hover:bg-white/40 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 backdrop-blur-md border border-white/20 dark:border-slate-600/30 shadow-lg dark:shadow-slate-900/40 transition-all duration-300"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-500" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </Button>
      </div>

      {/* Section 1: Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-xl dark:shadow-slate-900/40">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold font-heading bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-6">
            I Love Making PDF
          </h1>

          {/* Short Description */}
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            The most complete PDF toolkit. Merge, split, compress, convert, and secure your documents — all for free.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-heading shadow-lg hover:shadow-xl dark:shadow-slate-900/40 transition-all duration-300 hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={handleGetStarted}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-heading border-2 border-slate-300 dark:border-slate-600 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all duration-300 hover:scale-105 shadow-lg dark:shadow-slate-900/40"
            >
              Try Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2: Tool Showcase */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/70 dark:bg-slate-800/40 backdrop-blur-md border-y border-slate-200/50 dark:border-slate-600/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-6">
              Complete PDF Toolkit
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              13 professional PDF tools to handle all your document needs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {toolShowcase.map((tool, index) => (
              <div
                key={index}
                className="group flex flex-col items-center p-6 bg-white/60 dark:bg-slate-700/40 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-600/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-100 dark:from-slate-600 dark:to-slate-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <tool.icon className={`h-8 w-8 ${tool.color}`} />
                </div>
                <h3 className="text-sm font-semibold font-heading text-center">{tool.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple 3-step process to transform your PDFs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1: Upload */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold font-heading mb-4">1. Upload</h3>
              <p className="text-muted-foreground">
                Select files from your computer. Max 20MB, supports PDF and common formats.
              </p>
            </div>

            {/* Step 2: Process */}
            <div className="text-center">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cog className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-2xl font-bold font-heading mb-4">2. Process</h3>
              <p className="text-muted-foreground">
                Choose your tool and let our servers handle the conversion securely and quickly.
              </p>
            </div>

            {/* Step 3: Download */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold font-heading mb-4">3. Download</h3>
              <p className="text-muted-foreground">
                Get your processed file instantly. Files are automatically deleted after 1 hour.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Why Choose Us */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              Why Choose Us?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're different from other PDF tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Github className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">100% Open Source</h3>
              <p className="text-muted-foreground">
                No hidden fees, completely transparent and trustworthy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">100% Private</h3>
              <p className="text-muted-foreground">
                Files are processed locally and deleted automatically after 1 hour.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Optimized processing engines deliver results in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">No Ads</h3>
              <p className="text-muted-foreground">
                Clean, distraction-free interface focused on your productivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mr-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold font-heading">I Love Making PDF</h3>
              </div>
              <p className="text-slate-300 mb-6 max-w-md">
                The most complete PDF toolkit for professionals. Transform, secure, and manage your documents with ease.
              </p>
              
              {/* Social Media Icons */}
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  <Github className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  <Linkedin className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  <Twitter className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold font-heading mb-4">Company</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold font-heading mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2024 I Love Making PDF. All rights reserved.</p>
          </div>
        </div>
      </footer>


    </div>
  );
}