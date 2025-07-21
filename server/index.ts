import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeFileCleanup } from "./services/file-cleanup";



const app = express();
// Middleware - increased limits for PDF processing with large base64 data
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb', parameterLimit: 50000 }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Initialize database tables on startup
  try {
    const { initializeDatabase } = await import("./init-db");
    await initializeDatabase();
    console.log("Database initialized successfully");
  } catch (error) {
    console.warn("Database initialization failed, continuing with limited functionality:", error);
  }
  
  // Initialize file cleanup scheduler
  try {
    initializeFileCleanup();
    console.log("File cleanup scheduler initialized");
  } catch (error) {
    console.error("Error initializing file cleanup:", error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Request error:", err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log("Setting up static file serving...");
  console.log("Current environment:", app.get("env"));
  console.log("NODE_ENV:", process.env.NODE_ENV);
  if (app.get("env") === "development") {
    console.log("Using Vite dev server");
    await setupVite(app, server);
  } else {
    console.log("Using static file serving");
    try {
      serveStatic(app);
      console.log("Static files configured successfully");
    } catch (error) {
      console.error("Error setting up static files:", error);
      // Fallback: serve static files manually
      const path = await import("path");
      const distPath = path.default.resolve(process.cwd(), "dist", "public");
      console.log("Fallback: serving static files from:", distPath);
      app.use(express.static(distPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.default.resolve(distPath, "index.html"));
      });
    }
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Default to 5000 to match deployment configuration
  const port = parseInt(process.env.PORT || '5000', 10);
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Ready for deployment`);
    log(`serving on port ${port}`);
  });
})();
