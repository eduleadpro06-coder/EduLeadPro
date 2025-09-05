import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import session from 'express-session';
import cookieParser from 'cookie-parser';
import logger from './shared/config/logger.js';
import { StructuredLogger, LogCategory } from './shared/utils/structuredLogger.js';

const app = express();

// Cookie parser middleware
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevents client-side access to the cookie
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Avoid throwing after sending a response, which can crash serverless runtimes
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    // Log the full error for diagnostics
    try {
      console.error(err);
    } catch {}
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 3000 
  // this serves both the API and the client.
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    logger.info('Server started successfully');
    StructuredLogger.info(
      LogCategory.SYSTEM,
      `Server is running on port ${port}`,
      { environment: process.env.NODE_ENV }
    );
    log(`🚀 Server running on http://localhost:${port}`);
    log(`📱 Frontend and API both accessible at http://localhost:${port}`);
  });
})();