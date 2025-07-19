import React from 'react';
import { FileImage } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { pdfToImages } from '@/utils/pdf-utils';

const ImageOptions = ({ value, onChange }: { value: any; onChange: (value: any) => void }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Output Format</Label>
        <RadioGroup
          value={value.format || 'jpg'}
          onValueChange={(format) => onChange({ ...value, format })}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="jpg" id="jpg" />
            <Label htmlFor="jpg">JPG (smaller file size)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="png" id="png" />
            <Label htmlFor="png">PNG (better quality)</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default function PDFToJPG() {
  const handleProcess = async (files: File[], options: any): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one PDF file to convert');
    }
    
    const format = options.format || 'jpg';
    return await pdfToImages(files[0], format);
  };

  return (
    <PDFToolInterface
      toolName="pdf-to-jpg"
      toolTitle="PDF to Images"
      toolDescription="Convert your PDF pages to JPG or PNG images"
      acceptedTypes=".pdf"
      multiple={false}
      onProcess={handleProcess}
      options={<ImageOptions value={{}} onChange={() => {}} />}
      icon={FileImage}
    />
  );
}