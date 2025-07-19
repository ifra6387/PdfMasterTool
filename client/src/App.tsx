import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./hooks/use-auth";
import { SupabaseAuthProvider } from "./hooks/use-supabase-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Tools from "@/pages/tools";
import Processing from "@/pages/processing";
import Download from "@/pages/download";
import LoginStandalone from "@/pages/login-standalone";
import SignUpStandalone from "@/pages/signup-standalone";
import ToolPlaceholder from "@/pages/tool-placeholder";
import { AuthGuard } from "@/components/auth-guard";

// Import actual tool components
import MergePDF from "@/pages/tools/merge";
import SplitPDF from "@/pages/tools/split";
import CompressPDF from "@/pages/tools/compress";
import PDFToWord from "@/pages/tools/pdf-to-word";
import WordToPDF from "@/pages/tools/word-to-pdf";
import PDFToJPG from "@/pages/tools/pdf-to-jpg";
import JPGToPDF from "@/pages/tools/jpg-to-pdf";
import ProtectPDF from "@/pages/tools/protect-pdf";
import UnlockPDF from "@/pages/tools/unlock-pdf";
import PDFToExcel from "@/pages/tools/pdf-to-excel";
import ExcelToPDF from "@/pages/tools/excel-to-pdf";
import PowerPointToPDF from "@/pages/tools/powerpoint-to-pdf";
import PDFToPowerPoint from "@/pages/tools/pdf-to-powerpoint";
import PDFToHTML from "@/pages/tools/pdf-to-html";
import HTMLToPDF from "@/pages/tools/html-to-pdf";
import RotatePDF from "@/pages/tools/rotate-pdf";


function Router() {
  return (
    <Switch>
      {/* Tools page as default landing route */}
      <Route path="/" component={Tools} />
      
      {/* Old home page moved to /home for backwards compatibility */}
      <Route path="/home" component={Home} />
      
      {/* Tools also accessible at /tools */}
      <Route path="/tools" component={Tools} />

      <Route path="/processing/:fileId" component={Processing} />
      <Route path="/download/:token" component={Download} />
      
      <Route path="/signin" component={LoginStandalone} />
      <Route path="/login" component={LoginStandalone} />
      <Route path="/signup" component={SignUpStandalone} />
      
      {/* Dashboard redirect to tools home page */}
      <Route path="/dashboard" component={() => {
        const [, setLocation] = useLocation();
        useEffect(() => {
          setLocation('/', { replace: true });
        }, [setLocation]);
        return null;
      }} />
      
      {/* Actual tool routes */}
      <Route path="/tool/merge" component={MergePDF} />
      <Route path="/tool/split" component={SplitPDF} />
      <Route path="/tool/compress" component={CompressPDF} />
      <Route path="/tool/pdf-to-word" component={PDFToWord} />
      <Route path="/tool/word-to-pdf" component={WordToPDF} />
      <Route path="/tool/pdf-to-jpg" component={PDFToJPG} />
      <Route path="/tool/jpg-to-pdf" component={JPGToPDF} />
      <Route path="/tool/protect" component={ProtectPDF} />
      <Route path="/tool/unlock" component={UnlockPDF} />
      <Route path="/tool/pdf-to-excel" component={PDFToExcel} />
      <Route path="/tool/excel-to-pdf" component={ExcelToPDF} />
      <Route path="/tool/powerpoint-to-pdf" component={PowerPointToPDF} />
      <Route path="/tool/pdf-to-powerpoint" component={PDFToPowerPoint} />
      <Route path="/tool/pdf-to-html" component={PDFToHTML} />
      <Route path="/tool/html-to-pdf" component={HTMLToPDF} />
      <Route path="/tool/rotate" component={RotatePDF} />

      
      {/* Alternative routes with /tools/ prefix */}
      <Route path="/tools/merge" component={MergePDF} />
      <Route path="/tools/split" component={SplitPDF} />
      <Route path="/tools/compress" component={CompressPDF} />
      <Route path="/tools/pdf-to-word" component={PDFToWord} />
      <Route path="/tools/word-to-pdf" component={WordToPDF} />
      <Route path="/tools/pdf-to-jpg" component={PDFToJPG} />
      <Route path="/tools/jpg-to-pdf" component={JPGToPDF} />
      <Route path="/tools/protect" component={ProtectPDF} />
      <Route path="/tools/unlock" component={UnlockPDF} />
      <Route path="/tools/pdf-to-excel" component={PDFToExcel} />
      <Route path="/tools/excel-to-pdf" component={ExcelToPDF} />
      <Route path="/tools/pdf-to-html" component={PDFToHTML} />
      <Route path="/tools/html-to-pdf" component={HTMLToPDF} />

      
      {/* Fallback for other tools */}
      <Route path="/tool/:toolName" component={ToolPlaceholder} />
      <Route path="/tools/:toolName" component={ToolPlaceholder} />
      
      {/* Catch all other routes */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SupabaseAuthProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
