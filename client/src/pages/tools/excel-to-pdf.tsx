import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, Loader2, FileSpreadsheet, FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { excelToPDF } from '@/utils/pdf-utils-v2';
import { navigateBackToTools } from '@/utils/navigation';

export default function ExcelToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.xlsx') && 
          !selectedFile.name.toLowerCase().endsWith('.xls')) {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (20MB limit)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 20MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      setConvertedBlob(null);
    }
  };

  const convertToPdf = async () => {
    if (!file) return;

    setIsConverting(true);
    try {
      const pdfBlob = await excelToPDF(file);
      setConvertedBlob(pdfBlob);
      
      toast({
        title: "Conversion successful!",
        description: "Your Excel file has been converted to PDF",
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const downloadPdf = () => {
    if (!convertedBlob || !file) return;

    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetTool = () => {
    setFile(null);
    setConvertedBlob(null);
    setIsConverting(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Navigation Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigateBackToTools(setLocation)}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Tools
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Excel to PDF Converter
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Convert Excel spreadsheets to PDF documents with professional formatting
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Excel to PDF
          </CardTitle>
          <CardDescription>
            Upload your Excel file (.xlsx or .xls) and convert it to a professional PDF document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload Excel file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={isConverting}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Excel files up to 20MB (.xlsx, .xls)
              </p>
            </div>
          </div>

          {/* Selected File Info */}
          {file && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <FileSpreadsheet className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Convert Button */}
          <Button
            onClick={convertToPdf}
            disabled={!file || isConverting}
            className="w-full"
            size="lg"
          >
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting to PDF...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Convert to PDF
              </>
            )}
          </Button>

          {/* Download Section */}
          {convertedBlob && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      PDF ready for download
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Converted successfully
                    </p>
                  </div>
                </div>
                <Button onClick={downloadPdf} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}

          {/* Reset Button */}
          {(file || convertedBlob) && (
            <Button
              onClick={resetTool}
              variant="outline"
              className="w-full"
            >
              Convert Another File
            </Button>
          )}

          {/* Features */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Features:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Professional table formatting and layout preservation</li>
              <li>Multiple worksheet support with clear sheet separation</li>
              <li>Automatic styling and cell formatting</li>
              <li>High-quality PDF output suitable for printing</li>
              <li>Secure conversion - files deleted after processing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}