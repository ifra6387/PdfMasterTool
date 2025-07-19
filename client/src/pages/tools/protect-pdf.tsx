import React from 'react';
import { Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { protectPDF } from '@/utils/pdf-utils-v2';

const ProtectOptions = ({ value, onChange }: { value: any; onChange: (value: any) => void }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="password">Password Protection</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter password for the PDF"
          value={value.password || ''}
          onChange={(e) => onChange({ ...value, password: e.target.value })}
        />
        <p className="text-sm text-gray-500 mt-1">
          Choose a strong password to protect your PDF
        </p>
      </div>
    </div>
  );
};

export default function ProtectPDF() {
  const handleProcess = async (files: File[], options: any): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one PDF file to protect');
    }
    
    if (!options.password) {
      throw new Error('Please enter a password to protect the PDF');
    }
    
    return await protectPDF(files[0], options.password);
  };

  return (
    <PDFToolInterface
      toolName="protect-pdf"
      toolTitle="Protect PDF"
      toolDescription="Add password protection to your PDF document"
      acceptedTypes=".pdf"
      multiple={false}
      onProcess={handleProcess}
      options={<ProtectOptions value={{}} onChange={() => {}} />}
      icon={Lock}
    />
  );
}