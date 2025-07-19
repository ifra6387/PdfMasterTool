import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { jsPDF } from 'jspdf';

// Import the centralized worker setup
import { initializePdfWorker, pdfjsLib } from './worker-setup';

// Initialize PDF.js with proper worker setup
let pdfLibInitialized = false;
async function initializePdfJs() {
  if (pdfLibInitialized) return pdfjsLib;
  
  try {
    initializePdfWorker(); // Use centralized worker setup
    pdfLibInitialized = true;
    return pdfjsLib;
  } catch (error) {
    console.error('Failed to initialize PDF.js:', error);
    throw new Error('Failed to initialize PDF processing library');
  }
}

// PDF Merge utility
export async function mergePDFs(files: File[]): Promise<Blob> {
  if (files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge');
  }

  try {
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
      const pdfBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }
    
    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Merge error:', error);
    throw new Error('Failed to merge PDFs. Please ensure all files are valid PDF documents.');
  }
}

// PDF Split utility
export async function splitPDF(file: File, options: { type: 'pages' | 'range', startPage?: number, endPage?: number }): Promise<Blob> {
  try {
    const pdfBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const totalPages = pdf.getPageCount();
    
    if (options.type === 'pages') {
      // Split into individual pages and create a ZIP
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);
        const newPdfBytes = await newPdf.save();
        zip.file(`page-${i + 1}.pdf`, newPdfBytes);
      }
      
      return await zip.generateAsync({ type: 'blob' });
    } else {
      // Split by page range
      const startPage = Math.max(0, (options.startPage || 1) - 1);
      const endPage = Math.min(totalPages - 1, (options.endPage || totalPages) - 1);
      
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i));
      pages.forEach((page) => newPdf.addPage(page));
      
      const newPdfBytes = await newPdf.save();
      return new Blob([newPdfBytes], { type: 'application/pdf' });
    }
  } catch (error) {
    console.error('Split error:', error);
    throw new Error('Failed to split PDF. Please ensure the file is a valid PDF document.');
  }
}

// PDF Compression utility
export async function compressPDF(file: File, quality: number = 0.7): Promise<Blob> {
  try {
    const pdfBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    
    // Basic compression by re-saving with optimized settings
    const compressedBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
    });
    
    return new Blob([compressedBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress PDF. Please ensure the file is a valid PDF document.');
  }
}

// PDF to Images utility
export async function pdfToImages(file: File, format: 'jpg' | 'png' = 'jpg'): Promise<Blob> {
  try {
    const pdfjsLib = await initializePdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to create canvas context');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, `image/${format}`, 0.9);
      });
      
      zip.file(`page-${pageNum}.${format}`, imageBlob);
    }
    
    return await zip.generateAsync({ type: 'blob' });
  } catch (error) {
    console.error('PDF to images error:', error);
    throw new Error('Failed to convert PDF to images. Please ensure the file is a valid PDF document.');
  }
}

// Images to PDF utility
export async function imagesToPDF(files: File[]): Promise<Blob> {
  try {
    const pdf = new jsPDF();
    let firstPage = true;
    
    for (const file of files) {
      const imageData = await fileToBase64(file);
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });
      
      if (!firstPage) {
        pdf.addPage();
      }
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgRatio = img.width / img.height;
      const pdfRatio = pdfWidth / pdfHeight;
      
      let width, height;
      if (imgRatio > pdfRatio) {
        width = pdfWidth;
        height = pdfWidth / imgRatio;
      } else {
        width = pdfHeight * imgRatio;
        height = pdfHeight;
      }
      
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;
      
      pdf.addImage(imageData, 'JPEG', x, y, width, height);
      firstPage = false;
    }
    
    return pdf.output('blob');
  } catch (error) {
    console.error('Images to PDF error:', error);
    throw new Error('Failed to convert images to PDF. Please ensure all files are valid image files.');
  }
}

// PDF Password Protection utility
export async function protectPDF(file: File, password: string): Promise<Blob> {
  try {
    const pdfBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    
    // Note: pdf-lib has limited encryption support
    const protectedBytes = await pdf.save({
      userPassword: password,
      ownerPassword: password + '_owner',
    });
    
    return new Blob([protectedBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Protection error:', error);
    throw new Error('Failed to protect PDF. This feature has limited support for complex PDF documents.');
  }
}

// Unlock PDF utility
export async function unlockPDF(file: File, password?: string): Promise<Blob> {
  try {
    const pdfBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes, { password, ignoreEncryption: true });
    
    // Re-save without password
    const unlockedBytes = await pdf.save();
    return new Blob([unlockedBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Unlock error:', error);
    throw new Error('Failed to unlock PDF. The file may be heavily encrypted or require a different password.');
  }
}

// PDF to Word utility - Enhanced version with proper error handling
export async function pdfToWord(file: File): Promise<Blob> {
  try {
    const pdfjsLib = await initializePdfJs();
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF with ignoreEncryption option
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer, 
      ignoreEncryption: true,
      verbosity: 0 // Reduce console warnings
    }).promise;
    
    let allText = '';
    let totalCharacters = 0;
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Enhanced text extraction with better formatting
      const textItems: any[] = textContent.items;
      let pageText = '';
      let lastY = 0;
      let lastX = 0;
      
      // Sort items by Y position (top to bottom) then X position (left to right)
      textItems.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5]; // Y coordinate (inverted)
        if (Math.abs(yDiff) > 5) return yDiff > 0 ? -1 : 1;
        return a.transform[4] - b.transform[4]; // X coordinate
      });
      
      textItems.forEach((item: any, index: number) => {
        if (item.str && item.str.trim()) {
          const currentY = item.transform[5];
          const currentX = item.transform[4];
          const text = item.str.trim();
          
          // Add line break if Y position changed significantly (new line)
          if (lastY && Math.abs(lastY - currentY) > 5) {
            pageText += '\n';
          } 
          // Add space if on same line but X position indicates separation
          else if (lastX && currentX > lastX + 10) {
            pageText += ' ';
          }
          
          pageText += text;
          lastY = currentY;
          lastX = currentX + (text.length * 6); // Approximate character width
        }
      });
      
      
      // Clean up and add page text
      pageText = pageText.trim();
      if (pageText) {
        allText += pageText + '\n\n';
        totalCharacters += pageText.length;
      }
    }
    
    // Check if we extracted meaningful text
    if (totalCharacters < 10) {
      throw new Error('This PDF appears to be image-based and cannot be converted to editable Word. Please upload a text-based PDF.');
    }
    
    console.log(`Extracted ${totalCharacters} characters from ${pdf.numPages} pages`);
    
    // Create proper DOCX file using docx library
    const docxContent = await createDocxFromText(allText);
    return new Blob([docxContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  } catch (error) {
    console.error('PDF to Word error:', error);
    if (error instanceof Error && error.message.includes('image-based')) {
      throw error; // Re-throw specific error message
    }
    throw new Error('Failed to convert PDF to Word. Please ensure the PDF is not corrupted and contains readable text.');
  }
}

// Helper function to create DOCX from text using the docx library
async function createDocxFromText(text: string): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  
  // Split text into paragraphs
  const paragraphs = text.split('\n').filter(line => line.trim().length > 0);
  
  const docParagraphs = paragraphs.map(paragraphText => 
    new Paragraph({
      children: [
        new TextRun({
          text: paragraphText.trim(),
          size: 24, // 12pt font size (size is in half-points)
        }),
      ],
    })
  );
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });
  
  return await Packer.toBuffer(doc);
}

// Word to PDF utility - Enhanced version
export async function wordToPDF(file: File): Promise<Blob> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    
    // Convert DOCX to HTML
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
    
    // Clean and parse HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div');
    
    const pdf = new jsPDF();
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    
    let y = 20;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginBottom = 20;
    
    textElements.forEach((element) => {
      const text = element.textContent?.trim() || '';
      if (text) {
        // Handle headings with larger font size
        if (element.tagName.match(/^H[1-6]$/)) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(16);
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(12);
        }
        
        const lines = pdf.splitTextToSize(text, 170);
        
        // Check if we need a new page
        if (y + (lines.length * 7) > pageHeight - marginBottom) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.text(lines, 20, y);
        y += lines.length * 7 + 5; // Line spacing
      }
    });
    
    return pdf.output('blob');
  } catch (error) {
    console.error('Word to PDF error:', error);
    throw new Error('Failed to convert Word to PDF. Please ensure the file is a valid Word document (.docx format).');
  }
}

// PDF to Excel utility - New implementation
export async function pdfToExcel(file: File): Promise<Blob> {
  try {
    const pdfjsLib = await initializePdfJs();
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const workbook = XLSX.utils.book_new();
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract text and try to detect table-like structure
      const textItems = textContent.items;
      const lines: string[][] = [];
      let currentLine: string[] = [];
      let lastY = 0;
      
      // Sort by Y position then X position
      textItems.sort((a: any, b: any) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 5) return yDiff > 0 ? -1 : 1;
        return a.transform[4] - b.transform[4];
      });
      
      textItems.forEach((item: any) => {
        if (item.str.trim()) {
          const currentY = item.transform[5];
          
          // New line detected
          if (lastY && Math.abs(lastY - currentY) > 5) {
            if (currentLine.length > 0) {
              lines.push([...currentLine]);
              currentLine = [];
            }
          }
          
          currentLine.push(item.str.trim());
          lastY = currentY;
        }
      });
      
      // Add the last line
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      
      // Convert to worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(lines);
      XLSX.utils.book_append_sheet(workbook, worksheet, `Page${pageNum}`);
    }
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  } catch (error) {
    console.error('PDF to Excel error:', error);
    throw new Error('Failed to convert PDF to Excel. Please ensure the PDF contains readable text or tables.');
  }
}

// Excel to PDF utility - New implementation
export async function excelToPDF(file: File): Promise<Blob> {
  try {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    
    const pdf = new jsPDF();
    let firstSheet = true;
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (!firstSheet) {
        pdf.addPage();
      }
      
      // Add sheet title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(sheetName, 20, 20);
      
      let y = 40;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      jsonData.forEach((row, rowIndex) => {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        let x = 20;
        row.forEach((cell, colIndex) => {
          const cellText = String(cell || '');
          const textWidth = pdf.getTextWidth(cellText);
          
          // Adjust column width
          const colWidth = Math.max(30, Math.min(textWidth + 10, 50));
          
          pdf.text(cellText, x, y);
          x += colWidth;
          
          // Don't go beyond page width
          if (x > 180) {
            return;
          }
        });
        
        y += 10;
      });
      
      firstSheet = false;
    });
    
    return pdf.output('blob');
  } catch (error) {
    console.error('Excel to PDF error:', error);
    throw new Error('Failed to convert Excel to PDF. Please ensure the file is a valid Excel document.');
  }
}

// PDF to HTML utility - New implementation
export async function pdfToHtml(file: File): Promise<Blob> {
  try {
    const pdfjsLib = await initializePdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted PDF Document</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .page { margin-bottom: 50px; page-break-after: always; }
        .page-number { color: #666; font-size: 12px; margin-bottom: 20px; }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 10px; }
    </style>
</head>
<body>
`;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      htmlContent += `<div class="page">`;
      htmlContent += `<div class="page-number">Page ${pageNum}</div>`;
      
      // Extract text with formatting
      const textItems = textContent.items;
      let pageHtml = '';
      let lastY = 0;
      let inParagraph = false;
      
      // Sort by Y position then X position
      textItems.sort((a: any, b: any) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 5) return yDiff > 0 ? -1 : 1;
        return a.transform[4] - b.transform[4];
      });
      
      textItems.forEach((item: any, index: number) => {
        if (item.str.trim()) {
          const currentY = item.transform[5];
          const fontSize = item.transform[0];
          
          // Check for line break
          if (lastY && Math.abs(lastY - currentY) > 5) {
            if (inParagraph) {
              pageHtml += '</p>';
              inParagraph = false;
            }
          }
          
          // Start new paragraph if not already in one
          if (!inParagraph) {
            // Use font size to determine if it's a heading
            if (fontSize > 14) {
              pageHtml += `<h2>`;
            } else {
              pageHtml += `<p>`;
            }
            inParagraph = true;
          }
          
          pageHtml += item.str;
          
          // Add space if next item is on same line
          const nextItem = textItems[index + 1];
          if (nextItem && Math.abs(nextItem.transform[5] - currentY) <= 5) {
            pageHtml += ' ';
          }
          
          lastY = currentY;
        }
      });
      
      // Close any open paragraph
      if (inParagraph) {
        pageHtml += fontSize > 14 ? '</h2>' : '</p>';
      }
      
      htmlContent += pageHtml;
      htmlContent += `</div>`;
    }
    
    htmlContent += `
</body>
</html>`;
    
    return new Blob([htmlContent], { type: 'text/html' });
  } catch (error) {
    console.error('PDF to HTML error:', error);
    throw new Error('Failed to convert PDF to HTML. Please ensure the PDF contains readable text.');
  }
}

// HTML to PDF utility - New implementation
export async function htmlToPDF(file: File): Promise<Blob> {
  try {
    const htmlContent = await file.text();
    
    // Parse HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const pdf = new jsPDF();
    pdf.setFont('helvetica', 'normal');
    
    let y = 20;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginBottom = 20;
    
    // Extract text from HTML elements
    const elements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, span');
    
    elements.forEach((element) => {
      const text = element.textContent?.trim() || '';
      if (text) {
        // Handle different HTML elements
        const tagName = element.tagName.toLowerCase();
        
        if (tagName.match(/^h[1-6]$/)) {
          pdf.setFont('helvetica', 'bold');
          const level = parseInt(tagName.substring(1));
          pdf.setFontSize(20 - level * 2);
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(12);
        }
        
        const lines = pdf.splitTextToSize(text, 170);
        
        // Check if we need a new page
        if (y + (lines.length * 7) > pageHeight - marginBottom) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.text(lines, 20, y);
        y += lines.length * 7 + 5;
      }
    });
    
    return pdf.output('blob');
  } catch (error) {
    console.error('HTML to PDF error:', error);
    throw new Error('Failed to convert HTML to PDF. Please ensure the file contains valid HTML content.');
  }
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

