import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { excelToPDF } from '@/utils/pdf-utils-v2';

export default function ExcelToPDF() {
  const handleProcess = async (files: File[]): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one Excel file to convert');
    }
    
    try {
      return await excelToPDF(files[0]);
    } catch (error) {
      console.error('Excel to PDF conversion error:', error);
      throw new Error('Failed to convert Excel to PDF. Please ensure the file is a valid Excel document.');
    }
  };

  return (
    <PDFToolInterface
      toolName="excel-to-pdf"
      toolTitle="Excel to PDF"
      toolDescription="Convert your Excel spreadsheet to a PDF document"
      acceptedTypes=".xls,.xlsx"
      multiple={false}
      onProcess={handleProcess}
      icon={FileSpreadsheet}
    />
  );
}