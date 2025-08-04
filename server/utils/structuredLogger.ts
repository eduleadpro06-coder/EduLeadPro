import logger from '../config/logger';

export enum LogCategory {
  AUTH = 'AUTH',
  LEAD = 'LEAD',
  FINANCE = 'FINANCE',
  AI = 'AI',
  SYSTEM = 'SYSTEM',
  INTEGRATION = 'INTEGRATION'
}

export interface LogContext {
  userId?: string;
  ipAddress?: string;
  requestId?: string;
  [key: string]: any;
}

export class StructuredLogger {
  private static formatMessage(category: LogCategory, message: string, context?: LogContext): string {
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${category}] ${message}${contextStr}`;
  }

  static error(category: LogCategory, message: string, context?: LogContext) {
    logger.error(this.formatMessage(category, message, context));
  }

  static warn(category: LogCategory, message: string, context?: LogContext) {
    logger.warn(this.formatMessage(category, message, context));
  }

  static info(category: LogCategory, message: string, context?: LogContext) {
    logger.info(this.formatMessage(category, message, context));
  }

  static debug(category: LogCategory, message: string, context?: LogContext) {
    logger.debug(this.formatMessage(category, message, context));
  }

  static http(message: string, context?: LogContext) {
    logger.http(this.formatMessage(LogCategory.SYSTEM, message, context));
  }
} 