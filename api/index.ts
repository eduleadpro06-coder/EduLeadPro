import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes.js";
import session from 'express-session';
import cookieParser from 'cookie-parser';
import logger from '../server/config/logger.js';
// structured logger not required in serverless handler entry

const app = express();

// Cookie parser middleware
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict'
  }
}));

// CORS Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests explicitly
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

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

      // logger.info(logLine); // disabled for Vercel noise reduction
    }
  });

  next();
});

// Register API routes
let appInitialized = false;

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  logger.error(err);
});

export default async function handler(req: any, res: any) {
  try {
    if (!appInitialized) {
      console.log("Initializing API routes...");
      await registerRoutes(app);
      appInitialized = true;
      console.log("API routes initialized successfully");
    }
    return (app as any)(req, res);
  } catch (error: any) {
    console.error("Critical API Initialization Error:", error);

    // Use native Node.js methods since 'res' might not be an Express response yet
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    // Manually add CORS headers to the error response
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");

    res.end(JSON.stringify({
      error: "Server Initialization Failed",
      details: error.message,
      stack: error.stack
    }));
  }
}