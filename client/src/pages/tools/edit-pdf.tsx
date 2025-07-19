import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Loader2, FileText, ArrowLeft, Type, Square, Circle, Minus, Image, Pen, Eraser, Highlighter, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { editPDF } from '@/utils/pdf-utils-v2';

interface EditOperation {
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'image' | 'freehand' | 'eraser' | 'highlight';
  page: number;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  fontSize?: number;
  color?: string;
  width?: number;
  height?: number;
  imageData?: string;
  points?: Array<{x: number, y: number}>;
}

export default function EditPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBlob, setEditedBlob] = useState<Blob | null>(null);
  const [editOperations, setEditOperations] = useState<EditOperation[]>([]);
  
  // Current edit state
  const [currentTool, setCurrentTool] = useState<string>('text');
  const [currentText, setCurrentText] = useState<string>('');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [currentFontSize, setCurrentFontSize] = useState<number>(12);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState<number>(2);
  
  // PDF viewer state
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Array<{x: number, y: number}>>([]);

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validatePdfFile(selectedFile)) {
      setFile(selectedFile);
      setEditedBlob(null);
      setEditOperations([]);
      await loadPdfPages(selectedFile);
    }
  };

  const loadPdfPages = async (file: File) => {
    try {
      // Use PDF.js to render PDF pages as images for editing
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        toast({
          title: "PDF.js not loaded",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      
      const pages: string[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        pages.push(canvas.toDataURL());
      }
      
      setPdfPages(pages);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: "Error loading PDF",
        description: "Failed to load PDF for editing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const operation: EditOperation = {
      type: currentTool as any,
      page: currentPage,
      x,
      y,
      color: currentColor,
    };

    if (currentTool === 'text') {
      if (currentText.trim()) {
        operation.text = currentText;
        operation.fontSize = currentFontSize;
        setEditOperations(prev => [...prev, operation]);
        setCurrentText('');
      }
    } else if (currentTool === 'rectangle' || currentTool === 'circle') {
      // For shapes, we'll use click and drag - for now just add a default size
      operation.x1 = x;
      operation.y1 = y;
      operation.x2 = x + 100;
      operation.y2 = y + 50;
      operation.width = currentStrokeWidth;
      setEditOperations(prev => [...prev, operation]);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'freehand' && canvasRef.current) {
      setIsDrawing(true);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setCurrentPoints([{ x, y }]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && currentTool === 'freehand' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setCurrentPoints(prev => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentTool === 'freehand' && currentPoints.length > 1) {
      const operation: EditOperation = {
        type: 'freehand',
        page: currentPage,
        points: currentPoints,
        color: currentColor,
        width: currentStrokeWidth,
      };
      setEditOperations(prev => [...prev, operation]);
    }
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const addHighlight = () => {
    if (!canvasRef.current) return;
    
    // Add a default highlight area
    const operation: EditOperation = {
      type: 'highlight',
      page: currentPage,
      x1: 50,
      y1: 100,
      x2: 200,
      y2: 120,
      color: '#FFFF00',
    };
    setEditOperations(prev => [...prev, operation]);
  };

  const addEraser = () => {
    if (!canvasRef.current) return;
    
    // Add a white rectangle to "erase" content
    const operation: EditOperation = {
      type: 'eraser',
      page: currentPage,
      x1: 100,
      y1: 100,
      x2: 200,
      y2: 150,
    };
    setEditOperations(prev => [...prev, operation]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0];
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        const operation: EditOperation = {
          type: 'image',
          page: currentPage,
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          imageData,
        };
        setEditOperations(prev => [...prev, operation]);
      };
      reader.readAsDataURL(imageFile);
    }
  };

  const clearOperations = () => {
    setEditOperations([]);
    setCurrentText('');
  };

  const submitEdits = async () => {
    if (!file || editOperations.length === 0) {
      toast({
        title: "No edits to apply",
        description: "Please make some edits before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    try {
      const blob = await editPDF(file, editOperations);
      setEditedBlob(blob);
      
      toast({
        title: "PDF edited successfully!",
        description: `Applied ${editOperations.length} edit operations to your PDF`,
      });
    } catch (error) {
      console.error('PDF editing error:', error);
      toast({
        title: "PDF editing failed",
        description: error instanceof Error ? error.message : "Failed to edit PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const downloadFile = () => {
    if (editedBlob && file) {
      const url = URL.createObjectURL(editedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}_edited.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const resetTool = () => {
    setFile(null);
    setEditedBlob(null);
    setEditOperations([]);
    setPdfPages([]);
    setCurrentPage(0);
    setTotalPages(1);
    setCurrentText('');
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
          Edit PDF
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Add text, shapes, highlights, images, and annotations to your PDF documents
        </p>
      </div>

      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Professional PDF Editor
          </CardTitle>
          <CardDescription>
            Upload a PDF and use our editing tools to add content, annotations, and modifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload PDF file to edit</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={isEditing}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  PDF files up to 20MB
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
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {totalPages} pages • {editOperations.length} edits
                      </p>
                    </div>
                  </div>
                  <Button onClick={resetTool} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Editing Tools */}
              <Tabs defaultValue="tools" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tools">Editing Tools</TabsTrigger>
                  <TabsTrigger value="preview">PDF Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="tools" className="space-y-4">
                  {/* Tool Selection */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      variant={currentTool === 'text' ? 'default' : 'outline'}
                      onClick={() => setCurrentTool('text')}
                      className="flex items-center gap-2"
                    >
                      <Type className="h-4 w-4" />
                      Text
                    </Button>
                    <Button
                      variant={currentTool === 'rectangle' ? 'default' : 'outline'}
                      onClick={() => setCurrentTool('rectangle')}
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Rectangle
                    </Button>
                    <Button
                      variant={currentTool === 'circle' ? 'default' : 'outline'}
                      onClick={() => setCurrentTool('circle')}
                      className="flex items-center gap-2"
                    >
                      <Circle className="h-4 w-4" />
                      Circle
                    </Button>
                    <Button
                      variant={currentTool === 'freehand' ? 'default' : 'outline'}
                      onClick={() => setCurrentTool('freehand')}
                      className="flex items-center gap-2"
                    >
                      <Pen className="h-4 w-4" />
                      Freehand
                    </Button>
                  </div>

                  {/* Tool Properties */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentTool === 'text' && (
                      <>
                        <div>
                          <Label htmlFor="text-input">Text Content</Label>
                          <Input
                            id="text-input"
                            placeholder="Enter text to add"
                            value={currentText}
                            onChange={(e) => setCurrentText(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="font-size">Font Size</Label>
                          <Select onValueChange={(value) => setCurrentFontSize(parseInt(value))} value={currentFontSize.toString()}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="8">8px</SelectItem>
                              <SelectItem value="10">10px</SelectItem>
                              <SelectItem value="12">12px</SelectItem>
                              <SelectItem value="14">14px</SelectItem>
                              <SelectItem value="16">16px</SelectItem>
                              <SelectItem value="18">18px</SelectItem>
                              <SelectItem value="20">20px</SelectItem>
                              <SelectItem value="24">24px</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          type="color"
                          value={currentColor}
                          onChange={(e) => setCurrentColor(e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          placeholder="#000000"
                          value={currentColor}
                          onChange={(e) => setCurrentColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    {(currentTool === 'freehand' || currentTool === 'rectangle' || currentTool === 'circle') && (
                      <div>
                        <Label htmlFor="stroke-width">Stroke Width</Label>
                        <Select onValueChange={(value) => setCurrentStrokeWidth(parseInt(value))} value={currentStrokeWidth.toString()}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1px</SelectItem>
                            <SelectItem value="2">2px</SelectItem>
                            <SelectItem value="3">3px</SelectItem>
                            <SelectItem value="4">4px</SelectItem>
                            <SelectItem value="5">5px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button onClick={addHighlight} variant="outline" className="flex items-center gap-2">
                      <Highlighter className="h-4 w-4" />
                      Add Highlight
                    </Button>
                    <Button onClick={addEraser} variant="outline" className="flex items-center gap-2">
                      <Eraser className="h-4 w-4" />
                      Add Eraser
                    </Button>
                    <label className="cursor-pointer">
                      <Button variant="outline" className="flex items-center gap-2 w-full" asChild>
                        <span>
                          <Image className="h-4 w-4" />
                          Add Image
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <Button onClick={clearOperations} variant="outline" className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Clear All
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  {/* Page Navigation */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  )}

                  {/* PDF Preview Canvas */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {pdfPages[currentPage] && (
                      <div className="relative">
                        <img
                          src={pdfPages[currentPage]}
                          alt={`Page ${currentPage + 1}`}
                          className="w-full h-auto"
                        />
                        <canvas
                          ref={canvasRef}
                          className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                          onClick={handleCanvasClick}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 text-center">
                    Click on the PDF to add {currentTool} elements. {editOperations.filter(op => op.page === currentPage).length} edits on this page.
                  </p>
                </TabsContent>
              </Tabs>

              {/* Submit Button */}
              <div className="flex gap-3">
                {!editedBlob ? (
                  <Button
                    onClick={submitEdits}
                    disabled={editOperations.length === 0 || isEditing}
                    className="flex-1"
                  >
                    {isEditing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Applying Edits...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Apply {editOperations.length} Edits
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button onClick={downloadFile} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Edited PDF
                    </Button>
                    <Button onClick={resetTool} variant="outline">
                      Edit Another
                    </Button>
                  </>
                )}
              </div>

              {editedBlob && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✅ PDF edited successfully with {editOperations.length} modifications! Click download above.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}