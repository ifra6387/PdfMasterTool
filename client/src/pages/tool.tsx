import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { FileUpload } from "@/components/file-upload";
import { getToolById } from "@/lib/tools";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Tool() {
  const { toolName } = useParams<{ toolName: string }>();
  const [, setLocation] = useLocation();
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const tool = getToolById(toolName || "");

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!files.length) throw new Error("No files selected");
      if (!user) throw new Error("Please login to use this tool");

      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("tool", toolName || "");

      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "File uploaded successfully. Processing started.",
      });
      setLocation(`/processing/${data.file.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Upload failed",
        variant: "destructive",
      });
    },
  });

  if (!tool) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Tool Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The tool you're looking for doesn't exist.
              </p>
              <Button onClick={() => setLocation("/")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Login Required
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please login to use our PDF tools.
              </p>
              <div className="flex space-x-4 justify-center">
                <Button onClick={() => setLocation("/login")} className="bg-red-500 hover:bg-red-600">
                  Login
                </Button>
                <Button onClick={() => setLocation("/signup")} variant="outline">
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${tool.color}-100 dark:bg-${tool.color}-900/30`}>
                  <i className={`${tool.icon} text-${tool.color}-500 text-xl`} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tool.name}
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FileUpload
                acceptedTypes={tool.acceptedTypes}
                onFileSelect={setFiles}
                onUpload={() => uploadMutation.mutate()}
                uploading={uploadMutation.isPending}
                error={uploadMutation.error?.message}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
