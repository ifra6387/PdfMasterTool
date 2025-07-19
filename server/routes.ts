import type { Express, Request } from "express";
import { createServer, type Server } from "http";
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
