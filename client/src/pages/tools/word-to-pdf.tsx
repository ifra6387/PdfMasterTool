import React from 'react';
import { FileText } from 'lucide-react';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { wordToPDF } from '@/utils/pdf-utils-v2';

export default function WordToPDF() {
  const handleProcess = async (files: File[]): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one Word document to convert');
    }
    
    return await wordToPDF(files[0]);
  };

  return (
    <PDFToolInterface
      toolName="word-to-pdf"
      toolTitle="Word to PDF"
      toolDescription="Convert your Word document to a PDF file"
      acceptedTypes=".doc,.docx"
      multiple={false}
      onProcess={handleProcess}
      icon={FileText}
    />
  );
}