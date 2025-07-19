import React from 'react';
import { Merge } from 'lucide-react';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { mergePDFs } from '@/utils/pdf-utils-v2';

export default function MergePDF() {
  const handleProcess = async (files: File[]): Promise<Blob> => {
    if (files.length < 2) {
      throw new Error('Please select at least 2 PDF files to merge');
    }
    
    return await mergePDFs(files);
  };

  return (
    <PDFToolInterface
      toolName="merge-pdf"
      toolTitle="Merge PDFs"
      toolDescription="Combine multiple PDF files into one document"
      acceptedTypes=".pdf"
      multiple={true}
      onProcess={handleProcess}
      icon={Merge}
    />
  );
}