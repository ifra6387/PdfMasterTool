// PDF.js Worker Setup - Centralized configuration
import * as pdfjsLib from 'pdfjs-dist';

let workerInitialized = false;

export function initializePdfWorker() {
  if (!workerInitialized) {
    try {
      // Try to use the bundled worker first
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.js',
        import.meta.url,
      ).toString();
      workerInitialized = true;
    } catch (error) {
      console.warn('Failed to load bundled PDF worker, falling back to CDN:', error);
      
      // Fallback to CDN version
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      workerInitialized = true;
    }
  }
}

export { pdfjsLib };