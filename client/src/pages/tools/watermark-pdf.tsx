import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Loader2, FileText, Hash, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { addWatermarkToPDF, addPageNumbersToPDF } from '@/utils/pdf-utils-v2';

export default function WatermarkPdf() {
  // Watermark state
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [isAddingWatermark, setIsAddingWatermark] = useState(false);
  const [watermarkedBlob, setWatermarkedBlob] = useState<Blob | null>(null);
  const [watermarkText, setWatermarkText] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(20);
  const [color, setColor] = useState<string>('#808080');
  const [position, setPosition] = useState<string>('center');
  const [opacity, setOpacity] = useState<number>(0.3);

  // Page numbering state
  const [pageNumberFile, setPageNumberFile] = useState<File | null>(null);
  const [isAddingPageNumbers, setIsAddingPageNumbers] = useState(false);
  const [numberedBlob, setNumberedBlob] = useState<Blob | null>(null);
  const [numberPosition, setNumberPosition] = useState<string>('bottom-right');
  const [numberFontSize, setNumberFontSize] = useState<number>(12);
  const [startNumber, setStartNumber] = useState<number>(1);

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const validatePdfFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid PDF file.",
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 20MB",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleWatermarkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validatePdfFile(selectedFile)) {
      setWatermarkFile(selectedFile);
      setWatermarkedBlob(null);
    }
  };

  const handlePageNumberFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validatePdfFile(selectedFile)) {
      setPageNumberFile(selectedFile);
      setNumberedBlob(null);
    }
  };

  const addWatermark = async () => {
    if (!watermarkFile || !watermarkText.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file and enter watermark text",
        variant: "destructive",
      });
      return;
    }

    setIsAddingWatermark(true);
    try {
      const blob = await addWatermarkToPDF(watermarkFile, watermarkText, fontSize, color, position, opacity);
      setWatermarkedBlob(blob);
      
      toast({
        title: "Watermark added successfully!",
        description: `Watermark "${watermarkText}" has been applied to your PDF`,
      });
    } catch (error) {
      console.error('Watermark error:', error);
      toast({
        title: "Watermark failed",
        description: error instanceof Error ? error.message : "Failed to apply watermark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingWatermark(false);
    }
  };

  const addPageNumbers = async () => {
    if (!pageNumberFile) {
      toast({
        title: "Missing file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    setIsAddingPageNumbers(true);
    try {
      const blob = await addPageNumbersToPDF(pageNumberFile, numberPosition, numberFontSize, startNumber);
      setNumberedBlob(blob);
      
      toast({
        title: "Page numbers added successfully!",
        description: `Page numbers have been added to your PDF`,
      });
    } catch (error) {
      console.error('Page numbering error:', error);
      toast({
        title: "Page numbering failed",
        description: error instanceof Error ? error.message : "Failed to add page numbers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingPageNumbers(false);
    }
  };

  const downloadFile = (blob: Blob, originalFile: File, suffix: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${originalFile.name.replace(/\.[^/.]+$/, '')}_${suffix}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetWatermarkTool = () => {
    setWatermarkFile(null);
    setWatermarkedBlob(null);
    setIsAddingWatermark(false);
    setWatermarkText('');
    setFontSize(20);
    setColor('#808080');
    setPosition('center');
    setOpacity(0.3);
  };

  const resetPageNumberTool = () => {
    setPageNumberFile(null);
    setNumberedBlob(null);
    setIsAddingPageNumbers(false);
    setNumberPosition('bottom-right');
    setNumberFontSize(12);
    setStartNumber(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="text-center mb-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/dashboard')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Tools
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Add Watermark & Page Numbers
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Add watermarks and page numbers to your PDF documents with professional customization
        </p>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            PDF Watermark & Page Numbers
          </CardTitle>
          <CardDescription>
            Professional watermarking and page numbering for your PDF documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="watermark" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="watermark" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Add Watermark
              </TabsTrigger>
              <TabsTrigger value="page-numbers" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Add Page Numbers
              </TabsTrigger>
            </TabsList>

            {/* Watermark Tab */}
            <TabsContent value="watermark" className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="watermark-file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload PDF file for watermarking</span>
                      <input
                        id="watermark-file-upload"
                        name="watermark-file-upload"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={handleWatermarkFileChange}
                        disabled={isAddingWatermark}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    PDF files up to 20MB
                  </p>
                </div>
              </div>

              {watermarkFile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {watermarkFile.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(watermarkFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {watermarkFile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="watermark-text">Watermark Text</Label>
                    <Input
                      id="watermark-text"
                      placeholder="e.g., CONFIDENTIAL, DRAFT, etc."
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      disabled={isAddingWatermark}
                    />
                  </div>

                  <div>
                    <Label htmlFor="font-size">Font Size</Label>
                    <Select onValueChange={(value) => setFontSize(parseInt(value))} value={fontSize.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select font size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10px - Small</SelectItem>
                        <SelectItem value="15">15px - Medium</SelectItem>
                        <SelectItem value="20">20px - Large</SelectItem>
                        <SelectItem value="30">30px - Extra Large</SelectItem>
                        <SelectItem value="40">40px - Huge</SelectItem>
                        <SelectItem value="50">50px - Maximum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={isAddingWatermark}
                        className="w-16 h-10"
                      />
                      <Input
                        placeholder="#808080"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={isAddingWatermark}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Select onValueChange={setPosition} value={position}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="diagonal">Diagonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="opacity">Opacity: {opacity}</Label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      disabled={isAddingWatermark}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!watermarkedBlob ? (
                  <Button
                    onClick={addWatermark}
                    disabled={!watermarkFile || !watermarkText || isAddingWatermark}
                    className="flex-1"
                  >
                    {isAddingWatermark ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Watermark...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Add Watermark
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => downloadFile(watermarkedBlob, watermarkFile, 'watermarked')} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Watermarked PDF
                    </Button>
                    <Button onClick={resetWatermarkTool} variant="outline">
                      Watermark Another
                    </Button>
                  </>
                )}
              </div>

              {watermarkedBlob && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✅ Watermark applied successfully! Click the download button above.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Page Numbers Tab */}
            <TabsContent value="page-numbers" className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="page-number-file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload PDF file for page numbering</span>
                      <input
                        id="page-number-file-upload"
                        name="page-number-file-upload"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={handlePageNumberFileChange}
                        disabled={isAddingPageNumbers}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    PDF files up to 20MB
                  </p>
                </div>
              </div>

              {pageNumberFile && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Hash className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {pageNumberFile.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(pageNumberFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {pageNumberFile && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="number-position">Position</Label>
                    <Select onValueChange={setNumberPosition} value={numberPosition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="center-bottom">Center Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="number-font-size">Font Size</Label>
                    <Select onValueChange={(value) => setNumberFontSize(parseInt(value))} value={numberFontSize.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select font size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8px - Tiny</SelectItem>
                        <SelectItem value="10">10px - Small</SelectItem>
                        <SelectItem value="12">12px - Normal</SelectItem>
                        <SelectItem value="14">14px - Large</SelectItem>
                        <SelectItem value="16">16px - Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start-number">Starting Number</Label>
                    <Input
                      id="start-number"
                      type="number"
                      min="1"
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                      disabled={isAddingPageNumbers}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!numberedBlob ? (
                  <Button
                    onClick={addPageNumbers}
                    disabled={!pageNumberFile || isAddingPageNumbers}
                    className="flex-1"
                  >
                    {isAddingPageNumbers ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Page Numbers...
                      </>
                    ) : (
                      <>
                        <Hash className="h-4 w-4 mr-2" />
                        Add Page Numbers
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => downloadFile(numberedBlob, pageNumberFile, 'numbered')} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Numbered PDF
                    </Button>
                    <Button onClick={resetPageNumberTool} variant="outline">
                      Number Another
                    </Button>
                  </>
                )}
              </div>

              {numberedBlob && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✅ Page numbers added successfully! Click the download button above.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}