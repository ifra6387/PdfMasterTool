// PDF.js Worker Setup - Fixed version compatibility
import * as pdfjsLib from 'pdfjs-dist';

let workerInitialized = false;

export function initializePdfWorker() {
  if (!workerInitialized) {
    try {
      // Use exact version match to avoid API/Worker version mismatch
      const version = '3.11.174'; // Fixed compatible version
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;
      workerInitialized = true;
      console.log(`PDF.js worker initialized with version ${version}`);
    } catch (error) {
      console.error('Failed to initialize PDF worker:', error);
      throw new Error('PDF processing initialization failed');
    }
  }
}

export { pdfjsLib };