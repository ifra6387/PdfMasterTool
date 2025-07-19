import React from 'react';
import { Archive } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { compressPDF } from '@/utils/pdf-utils-v2';

const CompressOptions = ({ value, onChange }: { value: any; onChange: (value: any) => void }) => {
  const quality = value.quality || 0.7;
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="quality">Compression Level: {Math.round(quality * 100)}%</Label>
        <Slider
          id="quality"
          min={0.1}
          max={1}
          step={0.1}
          value={[quality]}
          onValueChange={(values) => onChange({ ...value, quality: values[0] })}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Higher Compression</span>
          <span>Better Quality</span>
        </div>
      </div>
    </div>
  );
};

export default function CompressPDF() {
  const handleProcess = async (files: File[], options: any): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one PDF file to compress');
    }
    
    const quality = options.quality || 0.7;
    return await compressPDF(files[0], quality);
  };

  return (
    <PDFToolInterface
      toolName="compress-pdf"
      toolTitle="Compress PDF"
      toolDescription="Reduce your PDF file size while maintaining quality"
      acceptedTypes=".pdf"
      multiple={false}
      onProcess={handleProcess}
      options={<CompressOptions value={{}} onChange={() => {}} />}
      icon={Archive}
    />
  );
}