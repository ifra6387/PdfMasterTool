import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Loader2, RotateCw, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { rotatePDF } from '@/utils/pdf-utils-v2';

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [rotationAngle, setRotationAngle] = useState<string>('');
  const [pageNumbers, setPageNumbers] = useState<string>('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a valid PDF file.",
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

  const rotatePdfFile = async () => {
    if (!file || !rotationAngle) {
      toast({
        title: "Missing information",
        description: "Please select a file and rotation angle",
        variant: "destructive",
      });
      return;
    }

    setIsRotating(true);
    try {
      const rotatedBlob = await rotatePDF(file, parseInt(rotationAngle), pageNumbers);
      setConvertedBlob(rotatedBlob);
      
      toast({
        title: "Rotation successful!",
        description: `Your PDF has been rotated ${rotationAngle}°`,
      });
    } catch (error) {
      console.error('Rotation error:', error);
      toast({
        title: "Rotation failed",
        description: error instanceof Error ? error.message : "Failed to rotate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRotating(false);
    }
  };

  const downloadRotatedPdf = () => {
    if (!convertedBlob || !file) return;

    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.[^/.]+$/, '')}_rotated.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetTool = () => {
    setFile(null);
    setConvertedBlob(null);
    setIsRotating(false);
    setRotationAngle('');
    setPageNumbers('');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Navigation Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Tools
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Rotate PDF
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Rotate PDF pages by 90°, 180°, or 270° with optional page selection
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-blue-600" />
            Rotate PDF Pages
          </CardTitle>
          <CardDescription>
            Upload your PDF file and rotate all pages or specific pages by your chosen angle
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
                  <span>Upload PDF file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={isRotating}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                PDF files up to 20MB
              </p>
            </div>
          </div>

          {/* Selected File Info */}
          {file && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <RotateCw className="h-8 w-8 text-blue-600 mr-3" />
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

          {/* Rotation Options */}
          {file && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rotation-angle">Rotation Angle</Label>
                <Select onValueChange={setRotationAngle} value={rotationAngle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rotation angle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90° Clockwise</SelectItem>
                    <SelectItem value="180">180° (Upside Down)</SelectItem>
                    <SelectItem value="270">270° Clockwise (90° Counter-clockwise)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="page-numbers">Page Numbers (Optional)</Label>
                <Input
                  id="page-numbers"
                  placeholder="e.g., 1,3,5-7,10 (leave empty for all pages)"
                  value={pageNumbers}
                  onChange={(e) => setPageNumbers(e.target.value)}
                  disabled={isRotating}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Specify pages to rotate, or leave empty to rotate all pages
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!convertedBlob ? (
              <Button
                onClick={rotatePdfFile}
                disabled={!file || !rotationAngle || isRotating}
                className="flex-1"
              >
                {isRotating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rotating...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Rotate PDF
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button onClick={downloadRotatedPdf} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Rotated PDF
                </Button>
                <Button onClick={resetTool} variant="outline">
                  Rotate Another
                </Button>
              </>
            )}
          </div>

          {/* Success Message */}
          {convertedBlob && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <p className="text-green-800 dark:text-green-200 font-medium">
                ✅ PDF rotated successfully! Click the download button above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}