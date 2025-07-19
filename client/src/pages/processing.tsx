import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Settings, CheckCircle, AlertCircle } from "lucide-react";
import { Navigation } from "@/components/navigation";

export default function Processing() {
  const { fileId } = useParams<{ fileId: string }>();
  const [, setLocation] = useLocation();

  const { data: status, refetch } = useQuery({
    queryKey: [`/api/files/${fileId}/status`],
    refetchInterval: 1000, // Poll every second
    enabled: !!fileId,
    meta: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  });

  useEffect(() => {
    if (status?.status === "completed") {
      // Find the processed file token and redirect to download
      // For now, we'll simulate getting the token from the fileId
      setTimeout(() => {
        // In a real implementation, you'd get the download token from the API
        setLocation(`/download/sample-token-${fileId}`);
      }, 1000);
    }
  }, [status, fileId, setLocation]);

  const getProgressValue = () => {
    switch (status?.status) {
      case "pending":
        return 25;
      case "processing":
        return 75;
      case "completed":
        return 100;
      case "failed":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusIcon = () => {
    switch (status?.status) {
      case "completed":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Settings className="h-8 w-8 text-red-500 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status?.status) {
      case "pending":
        return "Preparing your file...";
      case "processing":
        return "Processing your PDF...";
      case "completed":
        return "Processing complete!";
      case "failed":
        return "Processing failed. Please try again.";
      default:
        return "Starting...";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                {getStatusIcon()}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Processing Your File
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {getStatusText()}
              </p>
              
              <div className="mb-6">
                <Progress value={getProgressValue()} className="w-full" />
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please wait while we process your file...
              </p>
              
              {status?.status === "completed" && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Redirecting to download...
                </p>
              )}
              
              {status?.status === "failed" && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  Something went wrong. Please try again.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
