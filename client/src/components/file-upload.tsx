import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, FileText, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  acceptedTypes: string[];
  onFileSelect: (files: File[]) => void;
  onUpload: () => void;
  uploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

export function FileUpload({
  acceptedTypes,
  onFileSelect,
  onUpload,
  uploading = false,
  uploadProgress = 0,
  error,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      return "File size exceeds 20MB limit";
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return "Invalid file type";
    }

    return null;
  };

  const handleFileChange = useCallback((newFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      // Handle errors - you might want to show these in a toast
      console.error("File validation errors:", errors);
    }

    setFiles((prev) => [...prev, ...validFiles]);
    onFileSelect([...files, ...validFiles]);
  }, [files, acceptedTypes, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileChange(droppedFiles);
  }, [handleFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFileChange(selectedFiles);
  }, [handleFileChange]);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileSelect(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-8">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragOver
                ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10"
                : "border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <CloudUpload className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-semibold text-red-500">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Maximum file size: 20MB
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              accept={acceptedTypes.join(",")}
              onChange={handleFileInput}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Selected Files</h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-4 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setFiles([]);
                  onFileSelect([]);
                }}
              >
                Clear All
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={onUpload}
                disabled={files.length === 0 || uploading}
              >
                {uploading ? "Processing..." : "Process Files"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
