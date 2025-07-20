import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Download, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft 
} from 'lucide-react';
import { useLocation } from 'wouter';
import { navigateBackToTools } from '@/utils/navigation';

interface FileWithPreview {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
}

interface PDFToolInterfaceProps {
  toolName: string;
  toolTitle: string;
  toolDescription: string;
  acceptedTypes: string;
  multiple?: boolean;
  onProcess: (files: File[], options?: any) => Promise<Blob>;
  options?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

export default function PDFToolInterface({
  toolName,
  toolTitle,
  toolDescription,
  acceptedTypes,
  multiple = false,
  onProcess,
  options,
  icon: Icon
}: PDFToolInterfaceProps) {
  const [, setLocation] = useLocation();
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');
  const [toolOptions, setToolOptions] = useState<any>({});

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const fileList: FileWithPreview[] = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type
    }));

    if (multiple) {
      setSelectedFiles(prev => [...prev, ...fileList]);
    } else {
      setSelectedFiles(fileList.slice(0, 1));
    }
    setStatus('idle');
    setError(null);
  }, [multiple]);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const fileList: FileWithPreview[] = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type
    }));

    if (multiple) {
      setSelectedFiles(prev => [...prev, ...fileList]);
    } else {
      setSelectedFiles(fileList.slice(0, 1));
    }
    setStatus('idle');
    setError(null);
  }, [multiple]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleProcess = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setProcessing(true);
    setStatus('processing');
    setProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 20, 95));
      }, 200);

      const files = selectedFiles.map(f => f.file);
      const result = await onProcess(files, toolOptions);

      clearInterval(progressInterval);
      setProgress(100);

      // Create download URL
      const url = URL.createObjectURL(result);
      setDownloadUrl(url);
      
      // Generate appropriate filename based on tool and original file
      const originalFileName = selectedFiles[0]?.name || 'document';
      const baseName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
      
      let extension = 'pdf';
      if (toolName === 'pdf-to-word') extension = 'docx';
      else if (toolName === 'pdf-to-excel') extension = 'xlsx';
      else if (toolName === 'pdf-to-jpg' || toolName === 'pdf-to-png') extension = 'zip';
      else if (toolName === 'pdf-to-html') extension = 'html';
      else if (toolName.includes('to-pdf')) extension = 'pdf';
      
      setDownloadFileName(`${baseName}-converted.${extension}`);
      
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  const downloadFile = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetTool = () => {
    setSelectedFiles([]);
    setStatus('idle');
    setError(null);
    setProgress(0);
    setProcessing(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateBackToTools(setLocation)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-xl">
              <Icon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {toolTitle}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {toolDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload Area */}
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {multiple ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Max file size: 20MB
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept={acceptedTypes}
                    multiple={multiple}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Selected Files ({selectedFiles.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedFiles.map(file => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {file.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tool Options */}
                {options && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Options
                    </h4>
                    {React.cloneElement(options as React.ReactElement, {
                      value: toolOptions,
                      onChange: setToolOptions
                    })}
                  </div>
                )}

                {/* Process Button */}
                <Button
                  onClick={handleProcess}
                  disabled={selectedFiles.length === 0 || processing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Process ${multiple ? 'Files' : 'File'}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Status Section */}
          <div className="space-y-6">
            {/* Progress Card */}
            {status !== 'idle' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {status === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
                    {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {status === 'processing' && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Processing...</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    )}

                    {status === 'success' && (
                      <div className="space-y-4">
                        <Alert>
                          <CheckCircle className="w-4 h-4" />
                          <AlertDescription>
                            Processing completed successfully!
                          </AlertDescription>
                        </Alert>
                        <Button
                          onClick={downloadFile}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Result
                        </Button>
                        <Button
                          onClick={resetTool}
                          variant="outline"
                          className="w-full"
                        >
                          Process Another File
                        </Button>
                      </div>
                    )}

                    {status === 'error' && error && (
                      <div className="space-y-4">
                        <Alert variant="destructive">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <Button
                          onClick={resetTool}
                          variant="outline"
                          className="w-full"
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p>1. Select your {multiple ? 'files' : 'file'}</p>
                  <p>2. Configure options if needed</p>
                  <p>3. Click process to start</p>
                  <p>4. Download the result</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}