import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useLocation } from 'wouter';
import { FileText, Zap, Shield, Globe } from 'lucide-react';

export default function Home() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/tools');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-mint-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-heading font-bold">I Love Making PDF</span>
          </div>
          <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-heading font-bold text-gray-900 dark:text-white mb-6">
          Professional PDF Tools
          <span className="block text-blue-600">Made Simple</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Convert, merge, split, compress, and edit your PDF documents with our powerful online tools. 
          Fast, secure, and easy to use.
        </p>
        <Button 
          onClick={handleGetStarted}
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
        >
          Start Converting Now
        </Button>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-heading font-bold text-center mb-12">
          Everything You Need for PDF Management
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Convert & Transform</CardTitle>
              <CardDescription>
                Convert PDFs to Word, Excel, JPG, HTML and vice versa with perfect formatting
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-mint-600 mb-4" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Process your documents in seconds with our optimized conversion engines
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your files are automatically deleted after 1 hour. We never store your data
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Globe className="h-12 w-12 text-mint-600 mb-4" />
              <CardTitle>Works Everywhere</CardTitle>
              <CardDescription>
                No software installation required. Works on any device with a web browser
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-heading font-bold text-white">I Love Making PDF</span>
          </div>
          <p>Professional PDF tools for modern workflows</p>
        </div>
      </footer>
    </div>
  );
}