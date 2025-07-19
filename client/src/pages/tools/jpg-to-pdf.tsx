import React from 'react';
import { FileImage } from 'lucide-react';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { imagesToPDF } from '@/utils/pdf-utils';

export default function JPGToPDF() {
  const handleProcess = async (files: File[]): Promise<Blob> => {
    if (files.length === 0) {
      throw new Error('Please select at least one image file to convert');
    }
    
    return await imagesToPDF(files);
  };

  return (
    <PDFToolInterface
      toolName="jpg-to-pdf"
      toolTitle="Images to PDF"
      toolDescription="Convert your JPG, PNG, or other images to a PDF document"
      acceptedTypes=".jpg,.jpeg,.png,.gif,.bmp,.webp"
      multiple={true}
      onProcess={handleProcess}
      icon={FileImage}
    />
  );
}