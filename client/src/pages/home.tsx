import { Navigation } from "@/components/navigation";
import { ToolGrid } from "@/components/tool-grid";
import { Shield, CloudUpload, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Every tool you need to work with PDFs in one place
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Merge, split, compress, convert, and edit PDF files for free. 100% secure with automatic file deletion after 1 hour.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Shield className="text-green-500 mr-2 h-5 w-5" />
              <span>Files auto-delete after 1 hour</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <CloudUpload className="text-blue-500 mr-2 h-5 w-5" />
              <span>Max upload: 20MB</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Lock className="text-red-500 mr-2 h-5 w-5" />
              <span>100% Secure & Private</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <ToolGrid />

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-pdf text-white text-lg"></i>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  I Love Making PDF
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The complete PDF toolkit for all your document needs. Secure, fast, and completely free.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Shield className="text-green-500 mr-2 h-4 w-4" />
                  Files auto-delete after 1 hour
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Tools</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-red-500 transition-colors">Merge PDF</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Split PDF</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Compress PDF</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Convert PDF</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-red-500 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              © 2024 I Love Making PDF. All rights reserved. Built with ❤️ using open-source tools.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
