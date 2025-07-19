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

      // Run Python converter
      const pythonScript = path.join(process.cwd(), "server", "pdf_converter.py");
      
      const result = await new Promise<string>((resolve, reject) => {
        const python = spawn('python3', [pythonScript, req.file!.path, outputPath]);
        
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
            resolve(stdout);
          } else {
            console.error('Python conversion error:', stderr);
            reject(new Error(`Conversion failed: ${stderr || 'Unknown error'}`));
          }
        });

        python.on('error', (err) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
