import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { Link, useParams } from "wouter";

export default function ToolPlaceholder() {
  const params = useParams();
  const toolName = params.toolName || "Unknown Tool";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {toolName.charAt(0).toUpperCase() + toolName.slice(1)} Tool
          </h1>
        </div>

        {/* Tool Interface */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              {toolName} PDF Tool
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-12">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {toolName} Tool Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  This PDF processing tool is under development. Upload and processing functionality will be available soon.
                </p>
                <div className="flex justify-center gap-3">
                  <Button disabled>
                    Select Files
                  </Button>
                  <Link href="/dashboard">
                    <Button variant="outline">
                      Try Other Tools
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white">Secure</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Your files are processed securely</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white">Fast</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Quick processing and download</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white">Free</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">No registration required</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}