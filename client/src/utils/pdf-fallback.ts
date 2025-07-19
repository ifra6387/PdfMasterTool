// Fallback PDF processing when PDF.js fails
export const createPdfFallback = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // Create a simple fallback that shows the file was uploaded
    // but couldn't be rendered
    const canvas = document.createElement('canvas');
    canvas.width = 595;
    canvas.height = 842; // A4 dimensions
    
    const ctx = canvas.getContext('2d')!;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // PDF icon and text
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📄', canvas.width / 2, 200);
    
    ctx.font = 'bold 18px Arial';
    ctx.fillText('PDF File Loaded', canvas.width / 2, 250);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText(`File: ${file.name}`, canvas.width / 2, 280);
    ctx.fillText(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`, canvas.width / 2, 300);
    
    ctx.fillText('PDF preview not available', canvas.width / 2, 350);
    ctx.fillText('You can still edit this PDF using the tools above', canvas.width / 2, 380);
    
    // Note about editing
    ctx.fillStyle = '#0066cc';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Ready for Editing', canvas.width / 2, 420);
    
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.fillText('Use the editing tools above to add text, shapes, and images', canvas.width / 2, 450);
    ctx.fillText('Your edits will be applied when you save the PDF', canvas.width / 2, 470);
    
    const dataUrl = canvas.toDataURL('image/png');
    resolve([dataUrl]);
  });
};

// Simple PDF validator that doesn't rely on PDF.js
export const validatePdfStructure = (data: Uint8Array): boolean => {
  try {
    // Check PDF header
    const header = String.fromCharCode(...data.slice(0, 4));
    if (header !== '%PDF') return false;
    
    // Check for basic PDF structure markers
    const pdfString = String.fromCharCode(...data.slice(0, Math.min(2048, data.length)));
    const hasObjects = pdfString.includes(' obj') || pdfString.includes(' R');
    const hasXref = pdfString.includes('xref') || pdfString.includes('startxref');
    
    return hasObjects || hasXref;
  } catch {
    return false;
  }
};