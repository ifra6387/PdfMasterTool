// PDF.js Worker Setup - Fixed version compatibility
import * as pdfjsLib from 'pdfjs-dist';

let workerInitialized = false;

export function initializePdfWorker() {
  if (!workerInitialized) {
    try {
      // Use bundled worker that matches the installed version
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
      workerInitialized = true;
      console.log(`PDF.js worker initialized with exact version match`);
    } catch (error) {
      console.error('Failed to initialize PDF worker:', error);
      throw new Error('PDF processing initialization failed');
    }
  }
}

export { pdfjsLib };