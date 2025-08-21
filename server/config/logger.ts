import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Create logs directory if it doesn't exist
const isServerless = !!process.env.VERCEL;
const logsDir = isServerless ? path.join('/tmp', 'logs') : path.join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  try {
    mkdirSync(logsDir, { recursive: true });
  } catch {
    // In serverless environments, filesystem may be read-only; ignore errors
  }
}

// Define which transports the logger must use
const transports = [
  // Console transport for all logs
  new winston.transports.Console(),

  // File transport for errors
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
  }),

  // File transport for all logs
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'all-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  // Add this to ensure logs are written immediately
  exitOnError: false,
});

// Add a test log to verify logging is working
logger.info('Logger initialized successfully');

export default logger; 