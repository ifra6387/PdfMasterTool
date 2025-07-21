import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import { initializeFileCleanup } from "./services/file-cleanup";

const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb", parameterLimit: 50000 }));

// Logging Middleware
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
  await registerRoutes(app);

  try {
    const { initializeDatabase } = await import("./init-db");
    await initializeDatabase();
    console.log("✅ Database initialized successfully");
  } catch (error: any) {
    console.warn("⚠️ Database initialization failed:", error);
  }

  try {
    initializeFileCleanup();
    console.log("✅ File cleanup scheduler initialized");
  } catch (error: any) {
    console.error("❌ File cleanup error:", error);
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Explicit favicon route to ensure it's served correctly
  app.get("/favicon.ico", async (_req, res) => {
    const path = await import("path");
    const faviconPath = path.default.resolve(process.cwd(), "dist", "public", "favicon.ico");
    res.sendFile(faviconPath, (err) => {
      if (err) {
        res.status(404).send("Favicon not found");
      }
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Request error:", err);
  });

  // Always serve static in all envs (for Replit compatibility)
  const path = await import("path");
  const distPath = path.default.resolve(process.cwd(), "dist", "public");
  console.log("Serving static files from:", distPath);
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.default.resolve(distPath, "index.html"));
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Ready for deployment`);
    log(`serving on port ${port}`);
  });
})();
