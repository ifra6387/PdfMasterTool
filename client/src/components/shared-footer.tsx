import { FileText, Linkedin, Github } from 'lucide-react';

export function SharedFooter() {
  return (
    <footer className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
                I Love Making PDF
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md">
              Professional PDF tools with automatic file deletion after 1 hour for your privacy and security.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Linkedin className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Github className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="/about.html" className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">About Us</a></li>
              <li><a href="/contact.html" className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">Contact</a></li>
              <li><a href="/careers.html" className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">Careers</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="/privacy.html" className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms.html" className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">Terms of Service</a></li>
              <li><a href="/cookies.html" className="text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            © 2025 I Love Making PDF. All rights reserved. Files automatically deleted after 1 hour.
          </p>
        </div>
      </div>
    </footer>
  );
}