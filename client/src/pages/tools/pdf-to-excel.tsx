import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { pdfToExcel } from '@/utils/pdf-utils-v2';

export default function PDFToExcel() {
  const handleProcess = async (files: File[]): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one PDF file to convert');
    }
    
    try {
      return await pdfToExcel(files[0]);
    } catch (error) {
      console.error('PDF to Excel conversion error:', error);
      throw new Error('Failed to convert PDF to Excel. Please ensure the PDF contains readable text or tables.');
    }
  };

  return (
    <PDFToolInterface
      toolName="pdf-to-excel"
      toolTitle="PDF to Excel"
      toolDescription="Convert your PDF document to an Excel spreadsheet"
      acceptedTypes=".pdf"
      multiple={false}
      onProcess={handleProcess}
      icon={FileSpreadsheet}
    />
  );
}