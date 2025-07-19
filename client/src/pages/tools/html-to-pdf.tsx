import React from 'react';
import { Code } from 'lucide-react';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { htmlToPDF } from '@/utils/pdf-utils-v2';

export default function HTMLToPDF() {
  const handleProcess = async (files: File[]): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one HTML file to convert');
    }
    
    try {
      return await htmlToPDF(files[0]);
    } catch (error) {
      console.error('HTML to PDF conversion error:', error);
      throw new Error('Failed to convert HTML to PDF. Please ensure the file contains valid HTML content.');
    }
  };

  return (
    <PDFToolInterface
      toolName="html-to-pdf"
      toolTitle="HTML to PDF"
      toolDescription="Convert your HTML web page to a PDF document"
      acceptedTypes=".html,.htm"
      multiple={false}
      onProcess={handleProcess}
      icon={Code}
    />
  );
}