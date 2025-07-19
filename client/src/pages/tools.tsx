import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useLocation } from 'wouter';
import { 
  FileText, 
  Download, 
  Upload, 
  Combine, 
  Split, 
  Archive,
  Shield,
  Unlock,
  RotateCw,
  Image,
  FileSpreadsheet,
  Monitor,
  Edit3,
  Droplets
} from 'lucide-react';

export default function Tools() {
  const { user, signOut } = useSupabaseAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  if (!user) {
    setLocation('/');
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      setLocation('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const tools = [
    {
      title: 'PDF to Word',
      description: 'Convert PDF documents to editable Word files',
      icon: FileText,
      category: 'Convert'
    },
    {
      title: 'PDF to Excel',
      description: 'Extract tables and data to Excel spreadsheets',
      icon: FileSpreadsheet,
      category: 'Convert'
    },
    {
      title: 'PDF to JPG',
      description: 'Convert PDF pages to high-quality images',
      icon: Image,
      category: 'Convert'
    },
    {
      title: 'PDF to HTML',
      description: 'Convert PDF to responsive web pages',
      icon: Monitor,
      category: 'Convert'
    },
    {
      title: 'Merge PDFs',
      description: 'Combine multiple PDF files into one',
      icon: Combine,
      category: 'Organize'
    },
    {
      title: 'Split PDF',
      description: 'Extract specific pages from PDF files',
      icon: Split,
      category: 'Organize'
    },
    {
      title: 'Compress PDF',
      description: 'Reduce PDF file size without quality loss',
      icon: Archive,
      category: 'Optimize'
    },
    {
      title: 'Protect PDF',
      description: 'Add password protection to your PDFs',
      icon: Shield,
      category: 'Security'
    },
    {
      title: 'Unlock PDF',
      description: 'Remove password protection from PDFs',
      icon: Unlock,
      category: 'Security'
    },
    {
      title: 'Rotate PDF',
      description: 'Rotate PDF pages to correct orientation',
      icon: RotateCw,
      category: 'Edit'
    },
    {
      title: 'Edit PDF',
      description: 'Add text, images, and annotations',
      icon: Edit3,
      category: 'Edit'
    },
    {
      title: 'Watermark PDF',
      description: 'Add watermarks and page numbers',
      icon: Droplets,
      category: 'Edit'
    }
  ];

  const categories = ['Convert', 'Organize', 'Optimize', 'Security', 'Edit'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-mint-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-heading font-bold">I Love Making PDF</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            PDF Tools Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Choose from our comprehensive suite of PDF tools
          </p>
        </div>

        {/* Tools by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-heading font-semibold mb-4 text-gray-900 dark:text-white">
              {category}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tools
                .filter((tool) => tool.category === category)
                .map((tool) => (
                  <Card key={tool.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <tool.icon className="h-8 w-8 text-blue-600 mb-2" />
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Use Tool
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}