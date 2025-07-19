import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import { storage } from "./storage";
import { loginSchema, signupSchema, insertFileSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateToken, generateToken } from "./middleware/auth";
import { processFile } from "./services/pdf-processor";
import { v4 as uuidv4 } from "uuid";

// Extend Express Request type for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'text/html'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve tools directory BEFORE other routes
  app.get('/tools/:toolName', (req, res) => {
    const toolName = req.params.toolName;
    
    // Add .html extension if not present
    const fileName = toolName.endsWith('.html') ? toolName : `${toolName}.html`;
    const toolPath = path.join(process.cwd(), 'tools', fileName);
    
    if (fs.existsSync(toolPath)) {
      res.sendFile(toolPath);
    } else {
      res.status(404).json({ message: `Tool ${toolName} not found` });
    }
  });

  // Serve standalone HTML files
  app.get("/*.html", (req, res, next) => {
    const fileName = path.basename(req.path);
    const filePath = path.join(process.cwd(), fileName);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        name: data.name,
      });

      const token = generateToken(user.id);
      res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid input" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid input" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // File upload routes
  app.post("/api/files/upload", authenticateToken, upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { tool } = req.body;
      if (!tool) {
        return res.status(400).json({ message: "Tool not specified" });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

      const file = await storage.createFile({
        userId: req.userId!,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        tool,
        status: "pending",
        expiresAt,
      });

      res.json({ file });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Upload failed" });
    }
  });

  // File processing routes
  app.post("/api/files/:id/process", authenticateToken, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file || file.userId !== req.userId) {
        return res.status(404).json({ message: "File not found" });
      }

      if (file.status !== "pending") {
        return res.status(400).json({ message: "File already processed" });
      }

      // Update status to processing
      await storage.updateFileStatus(fileId, "processing");

      // Process file asynchronously
      processFile(file, storage).then(() => {
        console.log(`File ${fileId} processed successfully`);
      }).catch((error) => {
        console.error(`Error processing file ${fileId}:`, error);
        storage.updateFileStatus(fileId, "failed");
      });

      res.json({ message: "Processing started" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Processing failed" });
    }
  });

  // File status routes
  app.get("/api/files/:id/status", authenticateToken, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file || file.userId !== req.userId) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({ status: file.status });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get status" });
    }
  });

  // PDF to Word conversion route (Python-based)
  app.post("/api/convert/pdf-to-word", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: "Please upload a PDF file" });
      }

      // Create output directory
      const outputDir = path.join(process.cwd(), "outputs");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate output filename
      const originalName = path.parse(req.file.originalname).name;
      const outputFilename = `${originalName}-converted-${Date.now()}.docx`;
      const outputPath = path.join(outputDir, outputFilename);

      // Run advanced Python converter with professional structure preservation
      const pythonScript = path.join(process.cwd(), "server", "pdf_to_word_advanced.py");
      const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
      
      console.log(`Converting PDF: ${req.file.originalname}`);
      console.log(`Python path: ${pythonPath}`);
      console.log(`Script path: ${pythonScript}`);
      console.log(`Output path: ${outputPath}`);
      
      const result = await new Promise<string>((resolve, reject) => {
        const python = spawn(pythonPath, [pythonScript, req.file!.path, outputPath], {
          env: { ...process.env, PYTHONPATH: path.join(process.cwd(), ".pythonlibs", "lib", "python3.11", "site-packages") }
        });
        
        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log('Python stdout:', output);
        });

        python.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          console.log('Python stderr:', output);
        });

        python.on('close', (code) => {
          console.log(`Python process exited with code: ${code}`);
          if (code === 0) {
            resolve(stdout);
          } else {
            console.error('Python conversion failed:', stderr);
            reject(new Error(`Conversion failed (exit code ${code}): ${stderr || 'Unknown error'}`));
          }
        });

        python.on('error', (err) => {
          console.error('Python process error:', err);
          reject(new Error(`Failed to start Python process: ${err.message}`));
        });
      });

      // Parse the result
      let conversionResult;
      try {
        conversionResult = JSON.parse(result);
      } catch (e) {
        throw new Error('Invalid response from converter');
      }

      if (!conversionResult.success) {
        return res.status(400).json({ message: conversionResult.error });
      }

      // Check if output file exists
      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ message: "Conversion completed but output file not found" });
      }

      // Return the converted file
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      // Cleanup input file after a delay
      setTimeout(() => {
        try {
          fs.unlinkSync(req.file!.path);
          fs.unlinkSync(outputPath);
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 30000); // 30 seconds delay

    } catch (error: any) {
      console.error('PDF to Word conversion error:', error);
      res.status(500).json({ message: error.message || "Conversion failed" });
    }
  });

  // PDF to HTML conversion route (Python-based with OCR support)
  app.post("/api/convert/pdf-to-html", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: "Please upload a PDF file" });
      }

      // Create output directory
      const outputDir = path.join(process.cwd(), "outputs");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate output filename
      const originalName = path.parse(req.file.originalname).name;
      const outputFilename = `${originalName}-converted-${Date.now()}.html`;
      const outputPath = path.join(outputDir, outputFilename);

      // Run advanced Python HTML converter with OCR support
      const pythonScript = path.join(process.cwd(), "server", "pdf_to_html_advanced.py");
      const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
      
      console.log(`Converting PDF to HTML: ${req.file.originalname}`);
      console.log(`Python path: ${pythonPath}`);
      console.log(`Script path: ${pythonScript}`);
      console.log(`Output path: ${outputPath}`);
      
      const result = await new Promise<string>((resolve, reject) => {
        const python = spawn(pythonPath, [pythonScript, req.file!.path, outputPath], {
          env: { ...process.env, PYTHONPATH: path.join(process.cwd(), ".pythonlibs", "lib", "python3.11", "site-packages") }
        });
        
        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log('Python stdout:', output);
        });

        python.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          console.log('Python stderr:', output);
        });

        python.on('close', (code) => {
          console.log(`Python process exited with code: ${code}`);
          if (code === 0) {
            resolve(stdout);
          } else {
            console.error('Python HTML conversion failed:', stderr);
            reject(new Error(`HTML conversion failed (exit code ${code}): ${stderr || 'Unknown error'}`));
          }
        });

        python.on('error', (err) => {
          console.error('Python process error:', err);
          reject(new Error(`Failed to start Python process: ${err.message}`));
        });
      });

      // Parse the result
      let conversionResult;
      try {
        conversionResult = JSON.parse(result);
      } catch (e) {
        throw new Error('Invalid response from HTML converter');
      }

      if (!conversionResult.success) {
        return res.status(400).json({ message: conversionResult.error });
      }

      // Check if output file exists
      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ message: "HTML conversion completed but output file not found" });
      }

      // Return the converted file
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.setHeader('Content-Type', 'text/html');
      
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      // Cleanup input file after a delay
      setTimeout(() => {
        try {
          fs.unlinkSync(req.file!.path);
          fs.unlinkSync(outputPath);
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 30000); // 30 seconds delay

    } catch (error: any) {
      console.error('PDF to HTML conversion error:', error);
      res.status(500).json({ message: error.message || "HTML conversion failed" });
    }
  });

  // Word to PDF conversion route (Python-based with formatting preservation)
  app.post("/api/convert/word-to-pdf", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No Word file uploaded" });
      }

      if (!req.file.mimetype.includes('officedocument.wordprocessingml') && 
          !req.file.originalname.toLowerCase().endsWith('.docx')) {
        return res.status(400).json({ message: "Please upload a Word (.docx) file" });
      }

      // Create output directory
      const outputDir = path.join(process.cwd(), "outputs");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate output filename
      const originalName = path.parse(req.file.originalname).name;
      const outputFilename = `${originalName}-converted-${Date.now()}.pdf`;
      const outputPath = path.join(outputDir, outputFilename);

      // Run Python Word to PDF converter
      const pythonScript = path.join(process.cwd(), "server", "word_to_pdf_converter.py");
      const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
      
      // Create a temporary file with proper extension for Python script validation
      const tempInputPath = path.join(path.dirname(req.file.path), req.file.originalname);
      fs.copyFileSync(req.file.path, tempInputPath);
      
      console.log(`Converting Word to PDF: ${req.file.originalname}`);
      console.log(`Python path: ${pythonPath}`);
      console.log(`Script path: ${pythonScript}`);
      console.log(`Temp input path: ${tempInputPath}`);
      console.log(`Output path: ${outputPath}`);
      
      const result = await new Promise<string>((resolve, reject) => {
        const python = spawn(pythonPath, [pythonScript, tempInputPath, outputPath], {
          env: { ...process.env, PYTHONPATH: path.join(process.cwd(), ".pythonlibs", "lib", "python3.11", "site-packages") }
        });
        
        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log('Python stdout:', output);
        });

        python.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          console.log('Python stderr:', output);
        });

        python.on('close', (code) => {
          console.log(`Python process exited with code: ${code}`);
          if (code === 0) {
            resolve(stdout);
          } else {
            console.error('Python Word to PDF conversion failed:', stderr);
            reject(new Error(`Word to PDF conversion failed (exit code ${code}): ${stderr || 'Unknown error'}`));
          }
        });

        python.on('error', (err) => {
          console.error('Python process error:', err);
          reject(new Error(`Failed to start Python process: ${err.message}`));
        });
      });

      // Parse the result
      let conversionResult;
      try {
        conversionResult = JSON.parse(result);
      } catch (e) {
        throw new Error('Invalid response from Word to PDF converter');
      }

      if (!conversionResult.success) {
        return res.status(400).json({ message: conversionResult.error });
      }

      // Check if output file exists
      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ message: "Word to PDF conversion completed but output file not found" });
      }

      // Return the converted file
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      // Cleanup input file after a delay
      setTimeout(() => {
        try {
          fs.unlinkSync(req.file!.path);
          fs.unlinkSync(tempInputPath);
          fs.unlinkSync(outputPath);
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 30000); // 30 seconds delay

    } catch (error: any) {
      console.error('Word to PDF conversion error:', error);
      res.status(500).json({ message: error.message || "Word to PDF conversion failed" });
    }
  });

  // Excel to PDF conversion route
  app.post("/api/convert/excel-to-pdf", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No Excel file uploaded" });
      }

      if (!req.file.mimetype.includes('spreadsheetml') && 
          !req.file.originalname.toLowerCase().endsWith('.xlsx') && 
          !req.file.originalname.toLowerCase().endsWith('.xls')) {
        return res.status(400).json({ message: "Please upload an Excel (.xlsx or .xls) file" });
      }

      const outputDir = path.join(process.cwd(), "outputs");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const originalName = path.parse(req.file.originalname).name;
      const outputFilename = `${originalName}-converted-${Date.now()}.pdf`;
      const outputPath = path.join(outputDir, outputFilename);

      const pythonScript = path.join(process.cwd(), "server", "excel_to_pdf_converter.py");
      const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
      
      // Create a temporary file with proper extension for Python script validation
      const tempInputPath = path.join(path.dirname(req.file.path), req.file.originalname);
      fs.copyFileSync(req.file.path, tempInputPath);
      
      console.log(`Converting Excel to PDF: ${req.file.originalname}`);
      
      const result = await new Promise<string>((resolve, reject) => {
        const python = spawn(pythonPath, [pythonScript, tempInputPath, outputPath], {
          env: { ...process.env, PYTHONPATH: path.join(process.cwd(), ".pythonlibs", "lib", "python3.11", "site-packages") }
        });
        
        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log('Python stdout:', output);
        });

        python.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          console.log('Python stderr:', output);
        });

        python.on('close', (code) => {
          console.log(`Python process exited with code: ${code}`);
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(`Excel to PDF conversion failed (exit code ${code}): ${stderr || 'Unknown error'}`));
          }
        });

        python.on('error', (err) => {
          reject(new Error(`Failed to start Python process: ${err.message}`));
        });
      });

      let conversionResult;
      try {
        conversionResult = JSON.parse(result);
      } catch (e) {
        throw new Error('Invalid response from Excel to PDF converter');
      }

      if (!conversionResult.success) {
        return res.status(400).json({ message: conversionResult.error });
      }

      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ message: "Excel to PDF conversion completed but output file not found" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      setTimeout(() => {
        try {
          fs.unlinkSync(req.file!.path);
          fs.unlinkSync(tempInputPath);
          fs.unlinkSync(outputPath);
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 30000);

    } catch (error: any) {
      console.error('Excel to PDF conversion error:', error);
      res.status(500).json({ message: error.message || "Excel to PDF conversion failed" });
    }
  });

  // PowerPoint to PDF conversion route
  app.post("/api/convert/powerpoint-to-pdf", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PowerPoint file uploaded" });
      }

      if (!req.file.mimetype.includes('presentationml') && 
          !req.file.originalname.toLowerCase().endsWith('.pptx') && 
          !req.file.originalname.toLowerCase().endsWith('.ppt')) {
        return res.status(400).json({ message: "Please upload a PowerPoint (.pptx or .ppt) file" });
      }

      const outputDir = path.join(process.cwd(), "outputs");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const originalName = path.parse(req.file.originalname).name;
      const outputFilename = `${originalName}-converted-${Date.now()}.pdf`;
      const outputPath = path.join(outputDir, outputFilename);

      const pythonScript = path.join(process.cwd(), "server", "powerpoint_to_pdf_converter.py");
      const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
      
      // Create a temporary file with proper extension for Python script validation
      const tempInputPath = path.join(path.dirname(req.file.path), req.file.originalname);
      fs.copyFileSync(req.file.path, tempInputPath);
      
      console.log(`Converting PowerPoint to PDF: ${req.file.originalname}`);
      
      const result = await new Promise<string>((resolve, reject) => {
        const python = spawn(pythonPath, [pythonScript, tempInputPath, outputPath], {
          env: { ...process.env, PYTHONPATH: path.join(process.cwd(), ".pythonlibs", "lib", "python3.11", "site-packages") }
        });
        
        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log('Python stdout:', output);
        });

        python.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          console.log('Python stderr:', output);
        });

        python.on('close', (code) => {
          console.log(`Python process exited with code: ${code}`);
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(`PowerPoint to PDF conversion failed (exit code ${code}): ${stderr || 'Unknown error'}`));
          }
        });

        python.on('error', (err) => {
          reject(new Error(`Failed to start Python process: ${err.message}`));
        });
      });

      let conversionResult;
      try {
        conversionResult = JSON.parse(result);
      } catch (e) {
        throw new Error('Invalid response from PowerPoint to PDF converter');
      }

      if (!conversionResult.success) {
        return res.status(400).json({ message: conversionResult.error });
      }

      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ message: "PowerPoint to PDF conversion completed but output file not found" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      setTimeout(() => {
        try {
          fs.unlinkSync(req.file!.path);
          fs.unlinkSync(tempInputPath);
          fs.unlinkSync(outputPath);
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 30000);

    } catch (error: any) {
      console.error('PowerPoint to PDF conversion error:', error);
      res.status(500).json({ message: error.message || "PowerPoint to PDF conversion failed" });
    }
  });

  // PDF to PowerPoint conversion route
  app.post("/api/convert/pdf-to-powerpoint", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      if (!req.file.mimetype.includes('pdf') && !req.file.originalname.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ message: "Please upload a PDF file" });
      }

      const outputDir = path.join(process.cwd(), "outputs");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const originalName = path.parse(req.file.originalname).name;
      const outputFilename = `${originalName}-converted-${Date.now()}.pptx`;
      const outputPath = path.join(outputDir, outputFilename);

      const pythonScript = path.join(process.cwd(), "server", "pdf_to_powerpoint_converter.py");
      const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
      
      // Create a temporary file with proper extension for Python script validation
      const tempInputPath = path.join(path.dirname(req.file.path), req.file.originalname);
      fs.copyFileSync(req.file.path, tempInputPath);
      
      console.log(`Converting PDF to PowerPoint: ${req.file.originalname}`);
      
      const result = await new Promise<string>((resolve, reject) => {
        const python = spawn(pythonPath, [pythonScript, tempInputPath, outputPath], {
          env: { ...process.env, PYTHONPATH: path.join(process.cwd(), ".pythonlibs", "lib", "python3.11", "site-packages") }
        });
        
        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log('Python stdout:', output);
        });

        python.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          console.log('Python stderr:', output);
        });

        python.on('close', (code) => {
          console.log(`Python process exited with code: ${code}`);
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(`PDF to PowerPoint conversion failed (exit code ${code}): ${stderr || 'Unknown error'}`));
          }
        });

        python.on('error', (err) => {
          reject(new Error(`Failed to start Python process: ${err.message}`));
        });
      });

      let conversionResult;
      try {
        conversionResult = JSON.parse(result);
      } catch (e) {
        throw new Error('Invalid response from PDF to PowerPoint converter');
      }

      if (!conversionResult.success) {
        return res.status(400).json({ message: conversionResult.error });
      }

      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ message: "PDF to PowerPoint conversion completed but output file not found" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      setTimeout(() => {
        try {
          fs.unlinkSync(req.file!.path);
          fs.unlinkSync(tempInputPath);
          fs.unlinkSync(outputPath);
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 30000);

    } catch (error: any) {
      console.error('PDF to PowerPoint conversion error:', error);
      res.status(500).json({ message: error.message || "PDF to PowerPoint conversion failed" });
    }
  });

// Rotate PDF route
app.post('/api/convert/rotate-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a valid PDF file." });
    }

    // Validate file type
    if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ message: "Please upload a valid PDF file." });
    }

    // Parse rotation parameters
    const rotationAngle = parseInt(req.body.rotationAngle);
    if (!rotationAngle || ![90, 180, 270].includes(rotationAngle)) {
      return res.status(400).json({ message: "Please select a valid rotation angle (90°, 180°, or 270°)." });
    }

    const pageNumbers = req.body.pageNumbers?.trim() || '';

    // Setup output paths
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const originalName = path.parse(req.file.originalname).name;
    const outputFilename = `${originalName}_rotated_${rotationAngle}deg_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const pythonScript = path.join(process.cwd(), "server", "pdf_page_manager.py");
    const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
    
    // Create a temporary file with proper extension for Python script validation
    const tempInputPath = path.join(path.dirname(req.file.path), req.file.originalname);
    fs.copyFileSync(req.file.path, tempInputPath);
    
    console.log(`Rotating PDF: ${req.file.originalname} by ${rotationAngle}° (pages: ${pageNumbers || 'all'})`);
    
    const result = await new Promise<string>((resolve, reject) => {
      const args = [pythonScript, 'rotate', tempInputPath, outputPath, rotationAngle.toString()];
      if (pageNumbers) {
        args.push(pageNumbers);
      }
      
      const python = spawn(pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            if (result.success) {
              resolve(result.message);
            } else {
              reject(new Error(result.error || "Unknown error"));
            }
          } catch (e) {
            resolve("PDF rotated successfully");
          }
        } else {
          reject(new Error(`PDF rotation failed (exit code ${code}): ${stderr || stdout || "Unknown error"}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });

    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error("Output file was not created");
    }

    // Send the rotated PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Clean up files after 30 seconds
    setTimeout(() => {
      try {
        fs.unlinkSync(req.file!.path);
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(outputPath);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }, 30000);

  } catch (error: any) {
    console.error('PDF rotation error:', error);
    res.status(500).json({ message: "Failed to rotate PDF. Please try again." });
  }
});

  // Download routes
  app.get("/api/download/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const processedFile = await storage.getProcessedFileByToken(token);
      
      if (!processedFile) {
        return res.status(404).json({ message: "File not found or expired" });
      }

      if (processedFile.expiresAt < new Date()) {
        return res.status(410).json({ message: "File has expired" });
      }

      if (!fs.existsSync(processedFile.filePath)) {
        return res.status(404).json({ message: "File no longer available" });
      }

      res.download(processedFile.filePath, processedFile.fileName);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Download failed" });
    }
  });

  // User files routes
  app.get("/api/files", authenticateToken, async (req, res) => {
    try {
      const files = await storage.getUserFiles(req.userId!);
      res.json({ files });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get files" });
    }
  });

// Remove PDF pages route
app.post('/api/convert/remove-pages', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a valid PDF file." });
    }

    // Validate file type
    if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ message: "Please upload a valid PDF file." });
    }

    // Parse pages to remove
    const pagesToRemove = req.body.pagesToRemove?.trim();
    if (!pagesToRemove) {
      return res.status(400).json({ message: "Please specify which pages to remove." });
    }

    // Setup output paths
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const originalName = path.parse(req.file.originalname).name;
    const outputFilename = `${originalName}_pages_removed_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const pythonScript = path.join(process.cwd(), "server", "pdf_page_manager.py");
    const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
    
    // Create a temporary file with proper extension for Python script validation
    const tempInputPath = path.join(path.dirname(req.file.path), req.file.originalname);
    fs.copyFileSync(req.file.path, tempInputPath);
    
    console.log(`Removing pages from PDF: ${req.file.originalname} (pages: ${pagesToRemove})`);
    
    const result = await new Promise<string>((resolve, reject) => {
      const args = [pythonScript, 'remove', tempInputPath, outputPath, pagesToRemove];
      
      const python = spawn(pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            if (result.success) {
              resolve(result.message);
            } else {
              reject(new Error(result.error || "Unknown error"));
            }
          } catch (e) {
            resolve("Pages removed successfully");
          }
        } else {
          reject(new Error(`Page removal failed (exit code ${code}): ${stderr || stdout || "Unknown error"}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });

    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error("Output file was not created");
    }

    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    setTimeout(() => {
      try {
        fs.unlinkSync(req.file!.path);
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(outputPath);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }, 30000);

  } catch (error: any) {
    console.error('Page removal error:', error);
    res.status(500).json({ message: error.message || "Failed to remove pages from PDF." });
  }
});

// Add PDF pages route
app.post('/api/convert/add-pages', upload.fields([
  { name: 'mainFile', maxCount: 1 },
  { name: 'addFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.mainFile || !files.addFile) {
      return res.status(400).json({ message: "Please upload both PDF files." });
    }

    const mainFile = files.mainFile[0];
    const addFile = files.addFile[0];

    // Validate file types
    if (!mainFile.originalname.toLowerCase().endsWith('.pdf') || 
        !addFile.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ message: "Please upload valid PDF files." });
    }

    // Parse insertion point
    const insertionPoint = req.body.insertionPoint || 'end';

    // Setup output paths
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const originalName = path.parse(mainFile.originalname).name;
    const outputFilename = `${originalName}_pages_added_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const pythonScript = path.join(process.cwd(), "server", "pdf_page_manager.py");
    const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
    
    // Create temporary files with proper extensions
    const tempMainPath = path.join(path.dirname(mainFile.path), mainFile.originalname);
    const tempAddPath = path.join(path.dirname(addFile.path), addFile.originalname);
    fs.copyFileSync(mainFile.path, tempMainPath);
    fs.copyFileSync(addFile.path, tempAddPath);
    
    console.log(`Adding pages to PDF: ${mainFile.originalname} + ${addFile.originalname} (position: ${insertionPoint})`);
    
    const result = await new Promise<string>((resolve, reject) => {
      const args = [pythonScript, 'add', tempMainPath, tempAddPath, outputPath, insertionPoint];
      
      const python = spawn(pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            if (result.success) {
              resolve(result.message);
            } else {
              reject(new Error(result.error || "Unknown error"));
            }
          } catch (e) {
            resolve("Pages added successfully");
          }
        } else {
          reject(new Error(`Page addition failed (exit code ${code}): ${stderr || stdout || "Unknown error"}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });

    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error("Output file was not created");
    }

    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    setTimeout(() => {
      try {
        fs.unlinkSync(mainFile.path);
        fs.unlinkSync(addFile.path);
        fs.unlinkSync(tempMainPath);
        fs.unlinkSync(tempAddPath);
        fs.unlinkSync(outputPath);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }, 30000);

  } catch (error: any) {
    console.error('Page addition error:', error);
    res.status(500).json({ message: error.message || "Failed to add pages to PDF." });
  }
});

// Add watermark to PDF route
app.post('/api/convert/add-watermark', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a valid PDF file." });
    }

    // Validate file type
    if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ message: "Please upload a valid PDF file." });
    }

    // Parse watermark parameters
    const watermarkText = req.body.watermarkText?.trim();
    if (!watermarkText) {
      return res.status(400).json({ message: "Please provide watermark text." });
    }

    const fontSize = parseInt(req.body.fontSize) || 20;
    const color = req.body.color || "#808080";
    const position = req.body.position || "center";
    const opacity = parseFloat(req.body.opacity) || 0.3;

    // Setup output paths
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const originalName = path.parse(req.file.originalname).name;
    const outputFilename = `${originalName}_watermarked_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const pythonScript = path.join(process.cwd(), "server", "pdf_watermark_manager.py");
    const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
    
    // Create a temporary file with proper extension for Python script validation
    const tempInputPath = path.join(path.dirname(req.file.path), req.file.originalname);
    fs.copyFileSync(req.file.path, tempInputPath);
    
    console.log(`Adding watermark to PDF: ${req.file.originalname} (text: ${watermarkText})`);
    
    const result = await new Promise<string>((resolve, reject) => {
      const args = [pythonScript, 'watermark', tempInputPath, outputPath, watermarkText, fontSize.toString(), color, position, opacity.toString()];
      
      const python = spawn(pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            if (result.success) {
              resolve(result.message);
            } else {
              reject(new Error(result.error || "Unknown error"));
            }
          } catch (e) {
            resolve("Watermark added successfully");
          }
        } else {
          reject(new Error(`Watermark addition failed (exit code ${code}): ${stderr || stdout || "Unknown error"}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });

    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error("Output file was not created");
    }

    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    setTimeout(() => {
      try {
        fs.unlinkSync(req.file!.path);
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(outputPath);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }, 30000);

  } catch (error: any) {
    console.error('Watermark addition error:', error);
    res.status(500).json({ message: error.message || "Failed to apply watermark. Please try again." });
  }
});

// Add page numbers to PDF route
app.post('/api/convert/add-page-numbers', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a valid PDF file." });
    }

    // Validate file type
    if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ message: "Please upload a valid PDF file." });
    }

    // Parse page numbering parameters
    const position = req.body.position || "bottom-right";
    const fontSize = parseInt(req.body.fontSize) || 12;
    const startNumber = parseInt(req.body.startNumber) || 1;

    // Setup output paths
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const originalName = path.parse(req.file.originalname).name;
    const outputFilename = `${originalName}_numbered_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const pythonScript = path.join(process.cwd(), "server", "pdf_watermark_manager.py");
    const pythonPath = path.join(process.cwd(), ".pythonlibs", "bin", "python3");
    
    // Create a temporary file with proper extension for Python script validation
    const tempInputPath = path.join(path.dirname(req.file.path), req.file.originalname);
    fs.copyFileSync(req.file.path, tempInputPath);
    
    console.log(`Adding page numbers to PDF: ${req.file.originalname} (position: ${position})`);
    
    const result = await new Promise<string>((resolve, reject) => {
      const args = [pythonScript, 'page_numbers', tempInputPath, outputPath, position, fontSize.toString(), startNumber.toString()];
      
      const python = spawn(pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            if (result.success) {
              resolve(result.message);
            } else {
              reject(new Error(result.error || "Unknown error"));
            }
          } catch (e) {
            resolve("Page numbers added successfully");
          }
        } else {
          reject(new Error(`Page numbering failed (exit code ${code}): ${stderr || stdout || "Unknown error"}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });

    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error("Output file was not created");
    }

    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    setTimeout(() => {
      try {
        fs.unlinkSync(req.file!.path);
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(outputPath);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }, 30000);

  } catch (error: any) {
    console.error('Page numbering error:', error);
    res.status(500).json({ message: error.message || "Failed to add page numbers. Please try again." });
  }
});

  const httpServer = createServer(app);
  return httpServer;
}
