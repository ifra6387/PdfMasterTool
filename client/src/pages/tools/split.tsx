import React from 'react';
import { Split } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { splitPDF } from '@/utils/pdf-utils';

const SplitOptions = ({ value, onChange }: { value: any; onChange: (value: any) => void }) => {
  return (
    <div className="space-y-4">
      <RadioGroup
        value={value.type || 'pages'}
        onValueChange={(type) => onChange({ ...value, type })}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pages" id="pages" />
          <Label htmlFor="pages">Split into individual pages</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="range" id="range" />
          <Label htmlFor="range">Split by page range</Label>
        </div>
      </RadioGroup>

      {value.type === 'range' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startPage">Start Page</Label>
            <Input
              id="startPage"
              type="number"
              min="1"
              value={value.startPage || 1}
              onChange={(e) => onChange({ ...value, startPage: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="endPage">End Page</Label>
            <Input
              id="endPage"
              type="number"
              min="1"
              value={value.endPage || 1}
              onChange={(e) => onChange({ ...value, endPage: parseInt(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function SplitPDF() {
  const handleProcess = async (files: File[], options: any): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one PDF file to split');
    }
    
    return await splitPDF(files[0], options);
  };

  return (
    <PDFToolInterface
      toolName="split-pdf"
      toolTitle="Split PDF"
      toolDescription="Extract pages from your PDF document"
      acceptedTypes=".pdf"
      multiple={false}
      onProcess={handleProcess}
      options={<SplitOptions value={{}} onChange={() => {}} />}
      icon={Split}
    />
  );
}