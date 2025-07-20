import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { navigateBackToTools } from '@/utils/navigation';
import { Upload, FileText, Download, RotateCcw, ArrowLeft, Edit3, Type, PenTool, Image, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface Signature {
  type: 'draw' | 'text' | 'image';
  data: string; // Canvas data URL, text, or image data URL
  font?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export default function SignPDF() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // File and PDF state
  const [file, setFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  
  // Signature state
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [currentSignature, setCurrentSignature] = useState<Signature | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'text' | 'image'>('draw');
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<{x: number, y: number}[]>([]);
  
  // Text signature state
  const [signatureText, setSignatureText] = useState('');
  const [selectedFont, setSelectedFont] = useState('Helvetica');
  
  // Canvas refs
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Process state
  const [isSigning, setIsSigning] = useState(false);
  const [signedPdfBlob, setSignedPdfBlob] = useState<Blob | null>(null);

  // Load PDF.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = null;
        window.pdfjsLib.disableWorker = true;
      }
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a PDF file smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    await loadPDF(selectedFile);
  }, []);

  const loadPDF = async (file: File) => {
    try {
      if (!window.pdfjsLib) {
        throw new Error('PDF.js not loaded');
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const pdf = await window.pdfjsLib.getDocument({
        data: uint8Array,
        disableWorker: true,
      }).promise;

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(0);

      // Render all pages
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        pages.push(canvas.toDataURL());
      }

      setPdfPages(pages);
      
      toast({
        title: "PDF loaded successfully",
        description: `Ready to sign ${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('PDF loading error:', error);
      toast({
        title: "Error loading PDF",
        description: "Please try a different PDF file",
        variant: "destructive",
      });
    }
  };

  // Drawing functions
  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (signatureMode !== 'draw') return;
    
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsDrawing(true);
    setDrawingPoints([{ x, y }]);
  }, [signatureMode]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureMode !== 'draw') return;

    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setDrawingPoints(prev => [...prev, { x, y }]);

    // Draw on canvas
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';

    if (drawingPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(drawingPoints[drawingPoints.length - 1].x, drawingPoints[drawingPoints.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [isDrawing, signatureMode, drawingPoints]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Save drawn signature
    const canvas = signatureCanvasRef.current;
    if (canvas && drawingPoints.length > 1) {
      const dataURL = canvas.toDataURL();
      setCurrentSignature({
        type: 'draw',
        data: dataURL,
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        page: currentPage
      });
    }
  }, [isDrawing, drawingPoints, currentPage]);

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setDrawingPoints([]);
    setCurrentSignature(null);
  };

  // Text signature functions
  const generateTextSignature = () => {
    if (!signatureText.trim()) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size and font
    canvas.width = 400;
    canvas.height = 100;
    ctx.font = `italic 36px ${selectedFont}`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text
    ctx.fillText(signatureText, canvas.width / 2, canvas.height / 2);

    const dataURL = canvas.toDataURL();
    setCurrentSignature({
      type: 'text',
      data: dataURL,
      font: selectedFont,
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      page: currentPage
    });
  };

  // Image signature functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      setCurrentSignature({
        type: 'image',
        data: dataURL,
        x: 100,
        y: 100,
        width: 150,
        height: 75,
        page: currentPage
      });
    };
    reader.readAsDataURL(file);
  };

  // Place signature on PDF
  const placeSignatureOnPDF = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentSignature) return;

    const canvas = pdfCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const signature: Signature = {
      ...currentSignature,
      x: x - currentSignature.width / 2,
      y: y - currentSignature.height / 2,
      page: currentPage
    };

    setSignatures(prev => [...prev, signature]);
    setCurrentSignature(null);

    toast({
      title: "Signature placed",
      description: "Signature added to the PDF. You can add more or proceed to sign.",
    });
  };

  // Generate final signed PDF
  const generateSignedPDF = async () => {
    if (!file || signatures.length === 0) {
      toast({
        title: "No signatures to apply",
        description: "Please add at least one signature before signing",
        variant: "destructive",
      });
      return;
    }

    setIsSigning(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      for (const signature of signatures) {
        const page = pages[signature.page];
        if (!page) continue;

        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        // Convert canvas coordinates to PDF coordinates
        const pdfX = (signature.x / 600) * pageWidth; // Assuming canvas width of 600
        const pdfY = pageHeight - ((signature.y / 800) * pageHeight) - signature.height; // Flip Y coordinate

        if (signature.type === 'text') {
          // Add text signature
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
          page.drawText(signatureText, {
            x: pdfX,
            y: pdfY,
            size: 24,
            font: font,
            color: rgb(0, 0, 0),
          });
        } else {
          // Add image signature (drawn or uploaded)
          try {
            const imageData = signature.data.split(',')[1];
            const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
            
            let image;
            if (signature.data.includes('data:image/png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }

            const scaledWidth = (signature.width / 600) * pageWidth;
            const scaledHeight = (signature.height / 800) * pageHeight;

            page.drawImage(image, {
              x: pdfX,
              y: pdfY,
              width: scaledWidth,
              height: scaledHeight,
            });
          } catch (error) {
            console.error('Error embedding signature image:', error);
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setSignedPdfBlob(blob);

      toast({
        title: "PDF signed successfully!",
        description: `Added ${signatures.length} signature${signatures.length > 1 ? 's' : ''} to your PDF`,
      });
    } catch (error) {
      console.error('Error signing PDF:', error);
      toast({
        title: "Error signing PDF",
        description: "Please try again with a different PDF",
        variant: "destructive",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const downloadSignedPDF = () => {
    if (signedPdfBlob && file) {
      const url = URL.createObjectURL(signedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}_signed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const resetTool = () => {
    setFile(null);
    setPdfPages([]);
    setSignatures([]);
    setCurrentSignature(null);
    setSignedPdfBlob(null);
    setCurrentPage(0);
    setTotalPages(1);
    setSignatureText('');
    clearSignature();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="text-center mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigateBackToTools(setLocation)}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Tools
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Sign PDF
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Add digital signatures to your PDF documents with drawing, text, or image signatures
        </p>
      </div>

      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            Digital PDF Signature Tool
          </CardTitle>
          <CardDescription>
            Upload a PDF, create your signature, and place it anywhere on your document
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-2 py-1"
                  >
                    <span>Upload PDF file to sign</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  PDF files up to 20MB • Supports multi-page documents
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {totalPages} pages • {signatures.length} signatures
                      </p>
                    </div>
                  </div>
                  <Button onClick={resetTool} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PDF Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">PDF Preview</h3>
                  <div className="border rounded-lg p-4 bg-white">
                    {pdfPages[currentPage] && (
                      <div className="relative">
                        <img 
                          src={pdfPages[currentPage]} 
                          alt={`Page ${currentPage + 1}`}
                          className="w-full h-auto border"
                        />
                        <canvas
                          ref={pdfCanvasRef}
                          className="absolute inset-0 w-full h-full cursor-crosshair"
                          width={600}
                          height={800}
                          onClick={placeSignatureOnPDF}
                          style={{ background: 'transparent' }}
                        />
                        
                        {/* Render placed signatures */}
                        {signatures
                          .filter(sig => sig.page === currentPage)
                          .map((sig, index) => (
                            <img
                              key={index}
                              src={sig.data}
                              className="absolute border-2 border-blue-400 pointer-events-none"
                              style={{
                                left: sig.x,
                                top: sig.y,
                                width: sig.width,
                                height: sig.height,
                              }}
                              alt="Signature"
                            />
                          ))}
                      </div>
                    )}
                    
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {currentPage + 1} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                          disabled={currentPage === totalPages - 1}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature Creation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Create Signature</h3>
                  
                  <Tabs value={signatureMode} onValueChange={(value) => setSignatureMode(value as 'draw' | 'text' | 'image')}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="draw" className="flex items-center gap-2">
                        <PenTool className="h-4 w-4" />
                        Draw
                      </TabsTrigger>
                      <TabsTrigger value="text" className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Type
                      </TabsTrigger>
                      <TabsTrigger value="image" className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Upload
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="draw" className="space-y-4">
                      <div className="border rounded-lg bg-white">
                        <canvas
                          ref={signatureCanvasRef}
                          width={400}
                          height={200}
                          className="w-full cursor-crosshair border-b"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                        />
                        <div className="p-2 flex justify-between">
                          <span className="text-sm text-gray-500">Draw your signature above</span>
                          <Button variant="outline" size="sm" onClick={clearSignature}>
                            Clear
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signature-text">Your Name</Label>
                        <Input
                          id="signature-text"
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="font-select">Font Style</Label>
                        <Select value={selectedFont} onValueChange={setSelectedFont}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times">Times New Roman</SelectItem>
                            <SelectItem value="Courier">Courier</SelectItem>
                            <SelectItem value="cursive">Cursive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={generateTextSignature} className="w-full">
                        Generate Text Signature
                      </Button>
                      {currentSignature?.type === 'text' && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <img src={currentSignature.data} alt="Text signature preview" className="max-w-full h-auto" />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="image" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="image-upload">Upload Signature Image</Label>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          ref={imageInputRef}
                        />
                        <p className="text-xs text-gray-500">
                          Upload a PNG or JPEG image of your signature
                        </p>
                      </div>
                      {currentSignature?.type === 'image' && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <img src={currentSignature.data} alt="Uploaded signature preview" className="max-w-full h-auto" />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {currentSignature && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <MousePointer className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Signature ready! Click on the PDF preview to place it.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={generateSignedPDF}
                  disabled={signatures.length === 0 || isSigning}
                  className="px-8"
                >
                  {isSigning ? "Signing PDF..." : `Sign PDF (${signatures.length} signatures)`}
                </Button>
                
                {signedPdfBlob && (
                  <Button onClick={downloadSignedPDF} variant="outline" className="px-8">
                    <Download className="h-4 w-4 mr-2" />
                    Download Signed PDF
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}