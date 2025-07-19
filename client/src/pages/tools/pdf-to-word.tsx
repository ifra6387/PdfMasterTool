import React from 'react';
import { FileText } from 'lucide-react';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { pdfToWord } from '@/utils/pdf-utils-v2';

export default function PDFToWord() {
  const handleProcess = async (files: File[]): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one PDF file to convert');
    }
    
    try {
      return await pdfToWord(files[0]);
    } catch (error) {
      console.error('PDF to Word conversion error:', error);
      throw new Error('Failed to convert PDF to Word. Please ensure the PDF is not corrupted and contains readable text.');
    }
  };

  return (
    <PDFToolInterface
      toolName="pdf-to-word"
      toolTitle="PDF to Word"
      toolDescription="Convert your PDF document to an editable Word document"
      acceptedTypes=".pdf"
      multiple={false}
      onProcess={handleProcess}
      icon={FileText}
    />
  );
}