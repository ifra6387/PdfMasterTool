import React from 'react';
import { Code } from 'lucide-react';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { pdfToHtml } from '@/utils/pdf-utils-v2';

export default function PDFToHTML() {
  const handleProcess = async (files: File[]): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one PDF file to convert');
    }
    
    try {
      return await pdfToHtml(files[0]);
    } catch (error) {
      console.error('PDF to HTML conversion error:', error);
      throw new Error('Failed to convert PDF to HTML. Please ensure the PDF contains readable text.');
    }
  };

  return (
    <PDFToolInterface
      toolName="pdf-to-html"
      toolTitle="PDF to HTML"
      toolDescription="Convert your PDF document to an HTML web page"
      acceptedTypes=".pdf"
      multiple={false}
      onProcess={handleProcess}
      icon={Code}
    />
  );
}