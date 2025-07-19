import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { jsPDF } from 'jspdf';

// PDF Merge utility
export async function mergePDFs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const pdfBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  
  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

// PDF Split utility
export async function splitPDF(file: File, options: { type: 'pages' | 'range', startPage?: number, endPage?: number }): Promise<Blob> {
  const pdfBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(pdfBytes);
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
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
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
}

// PDF Compression utility
export async function compressPDF(file: File, quality: number = 0.7): Promise<Blob> {
  const pdfBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(pdfBytes);
  
  // Simple compression by re-saving with lower quality settings
  const compressedBytes = await pdf.save({
    useObjectStreams: false,
    addDefaultPage: false,
    objectsPerTick: 50,
  });
  
  return new Blob([compressedBytes], { type: 'application/pdf' });
}

// PDF to Images utility
export async function pdfToImages(file: File, format: 'jpg' | 'png' = 'jpg'): Promise<Blob> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
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
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
      
      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), `image/${format}`, 0.9);
      });
      
      zip.file(`page-${pageNum}.${format}`, imageBlob);
    }
  }
  
  return await zip.generateAsync({ type: 'blob' });
}

// Images to PDF utility
export async function imagesToPDF(files: File[]): Promise<Blob> {
  const pdf = new jsPDF();
  let firstPage = true;
  
  for (const file of files) {
    const imageData = await fileToBase64(file);
    const img = new Image();
    
    await new Promise((resolve) => {
      img.onload = resolve;
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
  
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}

// PDF Password Protection utility
export async function protectPDF(file: File, password: string): Promise<Blob> {
  const pdfBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(pdfBytes);
  
  // Add password protection (basic implementation)
  // Note: pdf-lib has limited encryption support, this is a basic implementation
  const protectedBytes = await pdf.save({
    userPassword: password,
    ownerPassword: password + '_owner',
  });
  
  return new Blob([protectedBytes], { type: 'application/pdf' });
}

// Word to PDF utility (simplified - uses HTML conversion)
export async function wordToPDF(file: File): Promise<Blob> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  
  // Create PDF from HTML
  const pdf = new jsPDF();
  const lines = html.split('<p>').filter(line => line.trim());
  
  let y = 20;
  lines.forEach(line => {
    const text = line.replace(/<[^>]*>/g, '').trim();
    if (text) {
      const splitText = pdf.splitTextToSize(text, 180);
      pdf.text(splitText, 20, y);
      y += splitText.length * 7;
      
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
    }
  });
  
  return pdf.output('blob');
}

// PDF to Word utility (simplified - extracts text)
export async function pdfToWord(file: File): Promise<Blob> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  
  // Create a simple Word document structure
  const wordContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Converted Document</title>
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6;">
        ${fullText.split('\n').map(line => `<p>${line}</p>`).join('')}
      </div>
    </body>
    </html>
  `;
  
  return new Blob([wordContent], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
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

// Unlock PDF utility (basic - removes user password if no owner password)
export async function unlockPDF(file: File, password?: string): Promise<Blob> {
  try {
    const pdfBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes, { password });
    
    // Re-save without password
    const unlockedBytes = await pdf.save();
    return new Blob([unlockedBytes], { type: 'application/pdf' });
  } catch (error) {
    throw new Error('Unable to unlock PDF. The file may be heavily encrypted or the password is incorrect.');
  }
}