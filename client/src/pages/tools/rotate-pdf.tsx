import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Loader2, RotateCw, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { navigateBackToTools } from '@/utils/navigation';
import { rotatePDF, removePDFPages, addPDFPages } from '@/utils/pdf-utils-v2';

export default function RotatePdf() {
  // Rotation state
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotatedBlob, setRotatedBlob] = useState<Blob | null>(null);
  const [rotationAngle, setRotationAngle] = useState<string>('');
  const [rotatePageNumbers, setRotatePageNumbers] = useState<string>('');

  // Remove pages state
  const [removeFile, setRemoveFile] = useState<File | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removedBlob, setRemovedBlob] = useState<Blob | null>(null);
  const [pagesToRemove, setPagesToRemove] = useState<string>('');

  // Add pages state
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [addFile, setAddFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addedBlob, setAddedBlob] = useState<Blob | null>(null);
  const [insertionPoint, setInsertionPoint] = useState<string>('end');

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const validatePdfFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid PDF file.",
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 20MB",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleRotateFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validatePdfFile(selectedFile)) {
      setRotateFile(selectedFile);
      setRotatedBlob(null);
    }
  };

  const handleRemoveFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validatePdfFile(selectedFile)) {
      setRemoveFile(selectedFile);
      setRemovedBlob(null);
    }
  };

  const handleMainFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validatePdfFile(selectedFile)) {
      setMainFile(selectedFile);
      setAddedBlob(null);
    }
  };

  const handleAddFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validatePdfFile(selectedFile)) {
      setAddFile(selectedFile);
      setAddedBlob(null);
    }
  };

  const rotatePdfFile = async () => {
    if (!rotateFile || !rotationAngle) {
      toast({
        title: "Missing information",
        description: "Please select a file and rotation angle",
        variant: "destructive",
      });
      return;
    }

    setIsRotating(true);
    try {
      const blob = await rotatePDF(rotateFile, parseInt(rotationAngle), rotatePageNumbers);
      setRotatedBlob(blob);
      
      toast({
        title: "Rotation successful!",
        description: `Your PDF has been rotated ${rotationAngle}°`,
      });
    } catch (error) {
      console.error('Rotation error:', error);
      toast({
        title: "Rotation failed",
        description: error instanceof Error ? error.message : "Failed to rotate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRotating(false);
    }
  };

  const removePdfPages = async () => {
    if (!removeFile || !pagesToRemove) {
      toast({
        title: "Missing information",
        description: "Please select a file and specify pages to remove",
        variant: "destructive",
      });
      return;
    }

    setIsRemoving(true);
    try {
      const blob = await removePDFPages(removeFile, pagesToRemove);
      setRemovedBlob(blob);
      
      toast({
        title: "Pages removed successfully!",
        description: `Specified pages have been removed from your PDF`,
      });
    } catch (error) {
      console.error('Page removal error:', error);
      toast({
        title: "Page removal failed",
        description: error instanceof Error ? error.message : "Failed to remove pages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const addPdfPages = async () => {
    if (!mainFile || !addFile) {
      toast({
        title: "Missing files",
        description: "Please upload both PDF files",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const blob = await addPDFPages(mainFile, addFile, insertionPoint);
      setAddedBlob(blob);
      
      toast({
        title: "Pages added successfully!",
        description: `Pages have been added to your PDF`,
      });
    } catch (error) {
      console.error('Page addition error:', error);
      toast({
        title: "Page addition failed",
        description: error instanceof Error ? error.message : "Failed to add pages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const downloadFile = (blob: Blob, originalFile: File, suffix: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${originalFile.name.replace(/\.[^/.]+$/, '')}_${suffix}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetRotateTool = () => {
    setRotateFile(null);
    setRotatedBlob(null);
    setIsRotating(false);
    setRotationAngle('');
    setRotatePageNumbers('');
  };

  const resetRemoveTool = () => {
    setRemoveFile(null);
    setRemovedBlob(null);
    setIsRemoving(false);
    setPagesToRemove('');
  };

  const resetAddTool = () => {
    setMainFile(null);
    setAddFile(null);
    setAddedBlob(null);
    setIsAdding(false);
    setInsertionPoint('end');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="text-center mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigateBackToTools(setLocation)}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Tools
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          PDF Page Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Rotate, remove, or add pages to your PDF documents with professional quality
        </p>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-blue-600" />
            PDF Page Manager
          </CardTitle>
          <CardDescription>
            Professional PDF page management with rotation, removal, and addition capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rotate" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rotate" className="flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotate Pages
              </TabsTrigger>
              <TabsTrigger value="remove" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Remove Pages
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Pages
              </TabsTrigger>
            </TabsList>

            {/* Rotate Tab */}
            <TabsContent value="rotate" className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="rotate-file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload PDF file to rotate</span>
                      <input
                        id="rotate-file-upload"
                        name="rotate-file-upload"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={handleRotateFileChange}
                        disabled={isRotating}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    PDF files up to 20MB
                  </p>
                </div>
              </div>

              {rotateFile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <RotateCw className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {rotateFile.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(rotateFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {rotateFile && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rotation-angle">Rotation Angle</Label>
                    <Select onValueChange={setRotationAngle} value={rotationAngle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rotation angle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90° Clockwise</SelectItem>
                        <SelectItem value="180">180° (Upside Down)</SelectItem>
                        <SelectItem value="270">270° Clockwise (90° Counter-clockwise)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rotate-page-numbers">Page Numbers (Optional)</Label>
                    <Input
                      id="rotate-page-numbers"
                      placeholder="e.g., 1,3,5-7,10 (leave empty for all pages)"
                      value={rotatePageNumbers}
                      onChange={(e) => setRotatePageNumbers(e.target.value)}
                      disabled={isRotating}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Specify pages to rotate, or leave empty to rotate all pages
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!rotatedBlob ? (
                  <Button
                    onClick={rotatePdfFile}
                    disabled={!rotateFile || !rotationAngle || isRotating}
                    className="flex-1"
                  >
                    {isRotating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rotating...
                      </>
                    ) : (
                      <>
                        <RotateCw className="h-4 w-4 mr-2" />
                        Rotate PDF
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => downloadFile(rotatedBlob, rotateFile, 'rotated')} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Rotated PDF
                    </Button>
                    <Button onClick={resetRotateTool} variant="outline">
                      Rotate Another
                    </Button>
                  </>
                )}
              </div>

              {rotatedBlob && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✅ PDF rotated successfully! Click the download button above.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Remove Tab */}
            <TabsContent value="remove" className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="remove-file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload PDF file for page removal</span>
                      <input
                        id="remove-file-upload"
                        name="remove-file-upload"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={handleRemoveFileChange}
                        disabled={isRemoving}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    PDF files up to 20MB
                  </p>
                </div>
              </div>

              {removeFile && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Trash2 className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {removeFile.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(removeFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {removeFile && (
                <div>
                  <Label htmlFor="pages-to-remove">Pages to Remove</Label>
                  <Input
                    id="pages-to-remove"
                    placeholder="e.g., 1,3,5-7,10"
                    value={pagesToRemove}
                    onChange={(e) => setPagesToRemove(e.target.value)}
                    disabled={isRemoving}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Specify which pages to remove from the PDF
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {!removedBlob ? (
                  <Button
                    onClick={removePdfPages}
                    disabled={!removeFile || !pagesToRemove || isRemoving}
                    className="flex-1"
                  >
                    {isRemoving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Removing Pages...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Pages
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => downloadFile(removedBlob, removeFile, 'pages_removed')} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Modified PDF
                    </Button>
                    <Button onClick={resetRemoveTool} variant="outline">
                      Remove From Another
                    </Button>
                  </>
                )}
              </div>

              {removedBlob && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✅ Pages removed successfully! Click the download button above.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Add Tab */}
            <TabsContent value="add" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="main-file-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Main PDF file</span>
                        <input
                          id="main-file-upload"
                          name="main-file-upload"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={handleMainFileChange}
                          disabled={isAdding}
                        />
                      </label>
                    </div>
                  </div>
                  {mainFile && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {mainFile.name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="add-file-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Pages to add</span>
                        <input
                          id="add-file-upload"
                          name="add-file-upload"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={handleAddFileChange}
                          disabled={isAdding}
                        />
                      </label>
                    </div>
                  </div>
                  {addFile && (
                    <div className="mt-3 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {addFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {mainFile && addFile && (
                <div>
                  <Label htmlFor="insertion-point">Insert Pages</Label>
                  <Select onValueChange={setInsertionPoint} value={insertionPoint}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose insertion point" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">At the beginning</SelectItem>
                      <SelectItem value="end">At the end</SelectItem>
                      <SelectItem value="2">After page 1</SelectItem>
                      <SelectItem value="3">After page 2</SelectItem>
                      <SelectItem value="4">After page 3</SelectItem>
                      <SelectItem value="5">After page 4</SelectItem>
                      <SelectItem value="6">After page 5</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Choose where to insert the new pages
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {!addedBlob ? (
                  <Button
                    onClick={addPdfPages}
                    disabled={!mainFile || !addFile || isAdding}
                    className="flex-1"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Pages...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Pages
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => downloadFile(addedBlob, mainFile, 'pages_added')} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Merged PDF
                    </Button>
                    <Button onClick={resetAddTool} variant="outline">
                      Merge Another
                    </Button>
                  </>
                )}
              </div>

              {addedBlob && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✅ Pages added successfully! Click the download button above.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}