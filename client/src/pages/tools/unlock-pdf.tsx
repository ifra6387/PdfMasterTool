import React from 'react';
import { Unlock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import PDFToolInterface from '@/components/pdf-tool-interface';
import { unlockPDF } from '@/utils/pdf-utils-v2';

const UnlockOptions = ({ value, onChange }: { value: any; onChange: (value: any) => void }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="password">Current PDF Password (if any)</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter the current PDF password"
          value={value.password || ''}
          onChange={(e) => onChange({ ...value, password: e.target.value })}
        />
        <p className="text-sm text-gray-500 mt-1">
          Leave empty if the PDF doesn't have a password or if you want to try unlocking without one
        </p>
      </div>
    </div>
  );
};

export default function UnlockPDF() {
  const handleProcess = async (files: File[], options: any): Promise<Blob> => {
    if (files.length !== 1) {
      throw new Error('Please select exactly one PDF file to unlock');
    }
    
    return await unlockPDF(files[0], options.password);
  };

  return (
    <PDFToolInterface
      toolName="unlock-pdf"
      toolTitle="Unlock PDF"
      toolDescription="Remove password protection from your PDF document"
      acceptedTypes=".pdf"
      multiple={false}
      onProcess={handleProcess}
      options={<UnlockOptions value={{}} onChange={() => {}} />}
      icon={Unlock}
    />
  );
}