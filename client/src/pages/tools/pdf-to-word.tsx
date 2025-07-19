import React from 'react';
import { FileText } from 'lucide-react';
import PDFToolInterface from '@/components/pdf-tool-interface';

export default function PDFToWord() {
  const handleProcess = async (files: File[]): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one PDF file to convert');
    }
    
    try {
      // Use the backend Python-based conversion
      const formData = new FormData();
      formData.append('file', files[0]);
      
      const response = await fetch('/api/convert/pdf-to-word', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Conversion failed');
      }
      
      // Return the blob directly from the response
      return await response.blob();
      
    } catch (error) {
      console.error('PDF to Word conversion error:', error);
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('no text') || error.message.includes('image-based')) {
          throw new Error('This PDF appears to be image-based or scanned. OCR processing is needed to extract text from such documents.');
        } else if (error.message.includes('encrypted')) {
          throw new Error('This PDF is password protected. Please unlock the PDF first or provide the password.');
        }
        throw new Error(error.message);
      }
      
      throw new Error('Failed to convert PDF to Word. Please ensure the PDF contains readable text.');
    }
  };

  return (
    <PDFToolInterface
      toolName="pdf-to-word"
      toolTitle="PDF to Word"
      toolDescription="Convert your PDF document to an editable Word document with proper formatting"
      acceptedTypes=".pdf"
      multiple={false}
      onProcess={handleProcess}
      icon={FileText}
    />
  );
}