import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Loader2, FileText, ArrowLeft, Type, Square, Circle, Minus, Image, Pen, Eraser, Highlighter, Save, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { editPDF } from '@/utils/pdf-utils-v2';

// Global PDF.js configuration
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface EditOperation {
  id: string;
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
  selected?: boolean;
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
  
  // Interactive editing state
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [canvasScale, setCanvasScale] = useState<number>(1);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Array<{x: number, y: number}>>([]);

  const validatePdfFile = (file: File) => {
    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid PDF file (.pdf extension required).",
        variant: "destructive",
      });
      return false;
    }
    
    // Check MIME type
    if (file.type && !file.type.includes('pdf')) {
      toast({
        title: "Invalid file format",
        description: "The selected file is not a PDF document.",
        variant: "destructive",
      });
      return false;
    }
    
    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a PDF file smaller than 20MB",
        variant: "destructive",
      });
      return false;
    }
    
    // Check minimum file size (avoid empty files)
    if (file.size < 100) {
      toast({
        title: "File too small",
        description: "The selected file appears to be empty or corrupted.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    // Reset previous state
    setFile(null);
    setEditedBlob(null);
    setEditOperations([]);
    setSelectedOperation(null);
    setPdfPages([]);
    setCurrentPage(0);
    setTotalPages(1);
    
    if (validatePdfFile(selectedFile)) {
      setFile(selectedFile);
      
      // Show loading state
      toast({
        title: "Loading PDF...",
        description: "Please wait while we process your PDF file.",
      });
      
      // Load PDF pages with a small delay to show loading message
      setTimeout(async () => {
        await loadPdfPages(selectedFile);
      }, 100);
    }
    
    // Clear the input to allow re-uploading the same file
    event.target.value = '';
  };

  const initializePdfJs = async () => {
    // Check if PDF.js is already loaded
    if (window.pdfjsLib) {
      console.log('PDF.js already loaded');
      return window.pdfjsLib;
    }

    console.log('Initializing PDF.js...');

    // Try multiple CDN sources for reliability
    const cdnSources = [
      {
        name: 'CDNJS',
        lib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
        worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      },
      {
        name: 'UNPKG',
        lib: 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
        worker: 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
      },
      {
        name: 'JSDelivr',
        lib: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
        worker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
      }
    ];

    let lastError = null;

    for (const source of cdnSources) {
      try {
        console.log(`Trying to load PDF.js from ${source.name}...`);
        
        // Load PDF.js from CDN
        const script = document.createElement('script');
        script.crossOrigin = 'anonymous';
        script.src = source.lib;
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log(`Successfully loaded PDF.js from ${source.name}`);
            resolve(true);
          };
          script.onerror = (error) => {
            console.error(`Failed to load script from ${source.name}:`, error);
            reject(error);
          };
          // Timeout after 15 seconds
          setTimeout(() => reject(new Error('Script load timeout')), 15000);
        });

        // Wait a moment for the library to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if PDF.js is available
        const pdfjsLib = window.pdfjsLib;
        if (pdfjsLib && typeof pdfjsLib.getDocument === 'function') {
          console.log('PDF.js library is available');
          
          // Set up worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = source.worker;
          console.log(`Worker configured: ${source.worker}`);
          
          // Test the library with a simple operation
          try {
            console.log('Testing PDF.js functionality...');
            // Create a minimal test to verify the library works
            const testData = new Uint8Array([37, 80, 68, 70]); // "%PDF" header
            const loadingTask = pdfjsLib.getDocument({ data: testData });
            
            // This should fail but not crash - we just want to test the API
            try {
              await loadingTask.promise;
            } catch (testError) {
              // Expected to fail with invalid PDF, but the API should work
              console.log('PDF.js API test completed (expected failure)');
            }
            
            console.log('PDF.js initialized successfully');
            return pdfjsLib;
          } catch (testError) {
            console.warn('PDF.js test failed, but library seems loaded:', testError);
            // Still return the library as it might work for real PDFs
            return pdfjsLib;
          }
        } else {
          throw new Error('PDF.js library not found after loading');
        }
      } catch (error) {
        console.error(`Failed to load PDF.js from ${source.name}:`, error);
        lastError = error;
        
        // Remove failed script
        const scripts = document.querySelectorAll(`script[src="${source.lib}"]`);
        scripts.forEach(s => s.remove());
        continue;
      }
    }

    // If all CDN sources failed, throw the last error
    console.error('All PDF.js CDN sources failed:', lastError);
    throw new Error('Failed to initialize PDF viewer. Please refresh the page and try again.');
  };

  const loadPdfPages = async (file: File) => {
    console.log('Starting PDF load process for:', file.name, 'Size:', file.size);
    
    try {
      // Initialize PDF.js
      console.log('Initializing PDF.js...');
      const pdfjsLib = await initializePdfJs();
      console.log('PDF.js initialized successfully');
      
      // Read file as array buffer
      console.log('Reading file as array buffer...');
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      console.log('File read successfully, size:', typedArray.length, 'bytes');
      
      // Check if it's a valid PDF by looking at the header
      const header = new TextDecoder().decode(typedArray.slice(0, 4));
      if (header !== '%PDF') {
        throw new Error('Invalid PDF: File does not start with %PDF header');
      }
      console.log('PDF header validation passed');
      
      // Load PDF document
      console.log('Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({
        data: typedArray,
        verbosity: 1, // Enable some logging for debugging
        disableStream: true,
        disableAutoFetch: true,
        disableRange: true,
        useSystemFonts: false
      });
      
      // Add progress monitoring
      loadingTask.onProgress = (progress: any) => {
        console.log('PDF loading progress:', progress);
      };
      
      const pdf = await loadingTask.promise;
      console.log('PDF document loaded successfully, pages:', pdf.numPages);
      
      if (!pdf || pdf.numPages === 0) {
        throw new Error('Invalid PDF: No pages found');
      }
      
      setTotalPages(pdf.numPages);
      
      // Render all pages
      console.log('Starting page rendering...');
      const pages: string[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`Rendering page ${pageNum}...`);
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          
          console.log(`Page ${pageNum} viewport:`, viewport.width, 'x', viewport.height);
          
          // Create canvas for rendering
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { alpha: false });
          
          if (!context) {
            throw new Error('Failed to get canvas context');
          }
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Set white background
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);

          // Render page to canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            enableWebGL: false,
            background: 'white'
          };

          console.log(`Starting render for page ${pageNum}...`);
          await page.render(renderContext).promise;
          console.log(`Page ${pageNum} rendered successfully`);
          
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 0.95);
          pages.push(dataUrl);
          
          // Clean up page
          page.cleanup();
        } catch (pageError) {
          console.error(`Error rendering page ${pageNum}:`, pageError);
          // Create placeholder for failed page
          const canvas = document.createElement('canvas');
          canvas.width = 595;
          canvas.height = 842;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#f8f9fa';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#dc3545';
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Failed to load page ${pageNum}`, canvas.width / 2, canvas.height / 2 - 20);
          ctx.fillStyle = '#6c757d';
          ctx.font = '14px Arial';
          ctx.fillText('Please try a different PDF file', canvas.width / 2, canvas.height / 2 + 20);
          pages.push(canvas.toDataURL());
        }
      }
      
      console.log('All pages processed successfully');
      setPdfPages(pages);
      setCurrentPage(0);
      
      toast({
        title: "PDF loaded successfully",
        description: `Ready to edit ${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''}`,
      });
      
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = "Failed to load PDF. Please try again.";
      let errorTitle = "Error loading PDF";
      
      if (error.name === 'PasswordException') {
        errorTitle = "Password Protected PDF";
        errorMessage = "This PDF is password protected. Please unlock the PDF first and try again.";
      } else if (error.name === 'InvalidPDFException') {
        errorTitle = "Invalid PDF File";
        errorMessage = "The uploaded file is not a valid PDF. Please select a valid PDF file.";
      } else if (error.name === 'MissingPDFException') {
        errorTitle = "Corrupted PDF";
        errorMessage = "The PDF file appears to be corrupted or incomplete.";
      } else if (error.message?.includes('PDF.js') || error.message?.includes('initialize')) {
        errorTitle = "PDF Viewer Error";
        errorMessage = "Failed to initialize PDF viewer. Please refresh the page and try again.";
      } else if (error.message?.includes('%PDF')) {
        errorTitle = "Invalid File Format";
        errorMessage = "The uploaded file is not a valid PDF document.";
      } else if (error.message?.includes('Network')) {
        errorTitle = "Network Error";
        errorMessage = "Network error while loading PDF viewer. Please check your connection and try again.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      
      // Reset state on error
      setPdfPages([]);
      setTotalPages(1);
      setCurrentPage(0);
    }
  };

  const getCanvasCoordinates = (event: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / canvasScale,
      y: (event.clientY - rect.top) / canvasScale
    };
  };

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(event);
    
    // Check if clicking on existing operation for selection
    const clickedOperation = editOperations
      .filter(op => op.page === currentPage)
      .find(op => {
        if (op.type === 'text') {
          return x >= (op.x || 0) && x <= (op.x || 0) + 100 && 
                 y >= (op.y || 0) - 20 && y <= (op.y || 0) + 5;
        } else if (op.type === 'rectangle' || op.type === 'highlight' || op.type === 'eraser') {
          return x >= Math.min(op.x1 || 0, op.x2 || 0) && 
                 x <= Math.max(op.x1 || 0, op.x2 || 0) &&
                 y >= Math.min(op.y1 || 0, op.y2 || 0) && 
                 y <= Math.max(op.y1 || 0, op.y2 || 0);
        } else if (op.type === 'circle') {
          const centerX = ((op.x1 || 0) + (op.x2 || 0)) / 2;
          const centerY = ((op.y1 || 0) + (op.y2 || 0)) / 2;
          const radius = Math.min(Math.abs((op.x2 || 0) - (op.x1 || 0)), Math.abs((op.y2 || 0) - (op.y1 || 0))) / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          return distance <= radius;
        }
        return false;
      });

    if (clickedOperation) {
      setSelectedOperation(clickedOperation.id);
      return;
    }

    // Clear selection if clicking empty area
    setSelectedOperation(null);

    // Add new operation
    const operation: EditOperation = {
      id: generateId(),
      type: currentTool as any,
      page: currentPage,
      x,
      y,
      color: currentColor,
    };

    if (currentTool === 'text' && currentText.trim()) {
      operation.text = currentText;
      operation.fontSize = currentFontSize;
      setEditOperations(prev => [...prev, operation]);
      setCurrentText('');
    } else if (currentTool === 'rectangle' || currentTool === 'circle') {
      operation.x1 = x;
      operation.y1 = y;
      operation.x2 = x + 100;
      operation.y2 = y + 50;
      operation.width = currentStrokeWidth;
      setEditOperations(prev => [...prev, operation]);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(event);
    
    if (currentTool === 'freehand') {
      setIsDrawing(true);
      setCurrentPoints([{ x, y }]);
    } else if (selectedOperation) {
      setIsDragging(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(event);
    
    if (isDrawing && currentTool === 'freehand') {
      setCurrentPoints(prev => [...prev, { x, y }]);
    } else if (isDragging && selectedOperation && dragStart) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      setEditOperations(prev => prev.map(op => {
        if (op.id === selectedOperation) {
          const updated = { ...op };
          if (op.type === 'text') {
            updated.x = (op.x || 0) + deltaX;
            updated.y = (op.y || 0) + deltaY;
          } else if (op.type === 'rectangle' || op.type === 'circle' || op.type === 'highlight' || op.type === 'eraser') {
            updated.x1 = (op.x1 || 0) + deltaX;
            updated.y1 = (op.y1 || 0) + deltaY;
            updated.x2 = (op.x2 || 0) + deltaX;
            updated.y2 = (op.y2 || 0) + deltaY;
          }
          return updated;
        }
        return op;
      }));
      
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentTool === 'freehand' && currentPoints.length > 1) {
      const operation: EditOperation = {
        id: generateId(),
        type: 'freehand',
        page: currentPage,
        points: currentPoints,
        color: currentColor,
        width: currentStrokeWidth,
      };
      setEditOperations(prev => [...prev, operation]);
    }
    
    setIsDrawing(false);
    setIsDragging(false);
    setCurrentPoints([]);
    setDragStart(null);
  };

  const addHighlight = () => {
    const operation: EditOperation = {
      id: generateId(),
      type: 'highlight',
      page: currentPage,
      x1: 50,
      y1: 100,
      x2: 200,
      y2: 120,
      color: '#FFFF00',
    };
    setEditOperations(prev => [...prev, operation]);
    setSelectedOperation(operation.id);
  };

  const addEraser = () => {
    const operation: EditOperation = {
      id: generateId(),
      type: 'eraser',
      page: currentPage,
      x1: 100,
      y1: 100,
      x2: 200,
      y2: 150,
    };
    setEditOperations(prev => [...prev, operation]);
    setSelectedOperation(operation.id);
  };

  const deleteSelectedOperation = () => {
    if (selectedOperation) {
      setEditOperations(prev => prev.filter(op => op.id !== selectedOperation));
      setSelectedOperation(null);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0];
    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit for images
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        const operation: EditOperation = {
          id: generateId(),
          type: 'image',
          page: currentPage,
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          imageData,
        };
        setEditOperations(prev => [...prev, operation]);
        setSelectedOperation(operation.id);
      };
      reader.readAsDataURL(imageFile);
    }
  };

  const clearOperations = () => {
    setEditOperations([]);
    setSelectedOperation(null);
    setCurrentText('');
  };

  const renderCanvasOperations = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render operations for current page
    const currentPageOps = editOperations.filter(op => op.page === currentPage);
    
    currentPageOps.forEach(op => {
      const isSelected = op.id === selectedOperation;
      
      ctx.save();
      
      if (op.type === 'text' && op.text) {
        ctx.font = `${op.fontSize || 12}px Arial`;
        ctx.fillStyle = op.color || '#000000';
        ctx.fillText(op.text, (op.x || 0) * canvasScale, (op.y || 0) * canvasScale);
        
        if (isSelected) {
          ctx.strokeStyle = '#0066cc';
          ctx.lineWidth = 2;
          const textWidth = ctx.measureText(op.text).width;
          ctx.strokeRect((op.x || 0) * canvasScale - 2, (op.y || 0) * canvasScale - (op.fontSize || 12) - 2, textWidth + 4, (op.fontSize || 12) + 4);
        }
      } else if (op.type === 'rectangle' || op.type === 'highlight' || op.type === 'eraser') {
        const x1 = (op.x1 || 0) * canvasScale;
        const y1 = (op.y1 || 0) * canvasScale;
        const x2 = (op.x2 || 0) * canvasScale;
        const y2 = (op.y2 || 0) * canvasScale;
        
        if (op.type === 'rectangle') {
          ctx.strokeStyle = op.color || '#000000';
          ctx.lineWidth = (op.width || 1) * canvasScale;
          ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        } else if (op.type === 'highlight') {
          ctx.fillStyle = op.color || '#FFFF00';
          ctx.globalAlpha = 0.3;
          ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        } else if (op.type === 'eraser') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
          ctx.strokeStyle = '#CCCCCC';
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        }
        
        if (isSelected) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#0066cc';
          ctx.lineWidth = 2;
          ctx.strokeRect(Math.min(x1, x2) - 2, Math.min(y1, y2) - 2, Math.abs(x2 - x1) + 4, Math.abs(y2 - y1) + 4);
        }
      } else if (op.type === 'circle') {
        const centerX = ((op.x1 || 0) + (op.x2 || 0)) / 2 * canvasScale;
        const centerY = ((op.y1 || 0) + (op.y2 || 0)) / 2 * canvasScale;
        const radius = Math.min(Math.abs((op.x2 || 0) - (op.x1 || 0)), Math.abs((op.y2 || 0) - (op.y1 || 0))) / 2 * canvasScale;
        
        ctx.strokeStyle = op.color || '#000000';
        ctx.lineWidth = (op.width || 1) * canvasScale;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        if (isSelected) {
          ctx.strokeStyle = '#0066cc';
          ctx.lineWidth = 2;
          ctx.strokeRect(centerX - radius - 2, centerY - radius - 2, (radius + 2) * 2, (radius + 2) * 2);
        }
      } else if (op.type === 'freehand' && op.points && op.points.length > 1) {
        ctx.strokeStyle = op.color || '#000000';
        ctx.lineWidth = (op.width || 2) * canvasScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(op.points[0].x * canvasScale, op.points[0].y * canvasScale);
        
        for (let i = 1; i < op.points.length; i++) {
          ctx.lineTo(op.points[i].x * canvasScale, op.points[i].y * canvasScale);
        }
        ctx.stroke();
      }
      
      ctx.restore();
    });
    
    // Render current drawing
    if (isDrawing && currentPoints.length > 1) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentStrokeWidth * canvasScale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x * canvasScale, currentPoints[0].y * canvasScale);
      
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x * canvasScale, currentPoints[i].y * canvasScale);
      }
      ctx.stroke();
    }
  };

  // Re-render canvas when operations change
  useEffect(() => {
    renderCanvasOperations();
  }, [editOperations, selectedOperation, currentPage, canvasScale, isDrawing, currentPoints]);

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
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-2 py-1"
                  >
                    <span>Upload PDF file to edit</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={isEditing}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  PDF files up to 20MB • Supports standard and encrypted PDFs
                </p>
                <div className="mt-3 text-xs text-gray-400">
                  <p>✓ Click to add text, shapes, and images</p>
                  <p>✓ Drag elements to reposition them</p>
                  <p>✓ Multi-page editing support</p>
                </div>
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
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    {pdfPages[currentPage] && (
                      <div 
                        className="relative mx-auto" 
                        style={{ maxWidth: '800px' }}
                      >
                        <img
                          src={pdfPages[currentPage]}
                          alt={`Page ${currentPage + 1}`}
                          className="w-full h-auto block"
                          onLoad={(e) => {
                            if (canvasRef.current) {
                              const img = e.target as HTMLImageElement;
                              const canvas = canvasRef.current;
                              canvas.width = img.naturalWidth;
                              canvas.height = img.naturalHeight;
                              canvas.style.width = img.offsetWidth + 'px';
                              canvas.style.height = img.offsetHeight + 'px';
                              setCanvasScale(img.offsetWidth / img.naturalWidth);
                              renderCanvasOperations();
                            }
                          }}
                        />
                        <canvas
                          ref={canvasRef}
                          className="absolute top-0 left-0 pointer-events-auto"
                          style={{ 
                            cursor: selectedOperation ? 'move' : (currentTool === 'freehand' ? 'crosshair' : 'pointer'),
                          }}
                          onClick={handleCanvasClick}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                        />
                      </div>
                    )}
                  </div>

                  {/* Interactive Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>
                        📝 {editOperations.filter(op => op.page === currentPage).length} edits on this page
                      </span>
                      {selectedOperation && (
                        <span className="text-blue-600 font-medium">
                          ✓ Selected: {editOperations.find(op => op.id === selectedOperation)?.type} element
                        </span>
                      )}
                    </div>
                    
                    {selectedOperation && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={deleteSelectedOperation}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete Selected
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>How to use:</strong> Select a tool above, then click on the PDF to add elements. 
                      Click existing elements to select and drag them. Use freehand tool to draw directly on the PDF.
                      {currentTool === 'text' && currentText.trim() === '' && ' Enter text in the field above first.'}
                    </p>
                  </div>
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