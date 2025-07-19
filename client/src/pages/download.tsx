import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, CheckCircle, Clock, RotateCcw } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";

export default function DownloadPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/download/${token}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Download failed");
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : 'processed-file.pdf';
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Download started!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Download failed",
        variant: "destructive",
      });
    }
  };

  const handleProcessAnother = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Your File is Ready!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your PDF has been processed successfully. Click the download button to save it to your device.
              </p>
              
              {/* File Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-3">
                  <i className="fas fa-file-pdf text-red-500 text-2xl"></i>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      processed-document.pdf
                    </p>
                    <p className="text-sm text-gray-500">
                      Ready for download
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-delete warning */}
              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  File will be automatically deleted in 1 hour
                </AlertDescription>
              </Alert>
              
              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleProcessAnother}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Process Another
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
