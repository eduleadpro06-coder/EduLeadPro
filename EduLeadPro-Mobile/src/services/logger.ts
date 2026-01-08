/**
 * Mobile App Logger
 * Sends logs to backend so they appear in Vercel logs
 * Similar to console.log but also sends to server
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_BASE_URL = __DEV__
    ? 'http://localhost:5000/api'
    : 'https://eduleadconnect.vercel.app/api';

class MobileLogger {
    private enabled: boolean = true;
    private batchLogs: any[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    private readonly BATCH_SIZE = 10;
    private readonly FLUSH_INTERVAL_MS = 5000; // 5 seconds

    constructor() {
        this.initBatching();
    }

    private initBatching() {
        // Flush logs every 5 seconds
        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.FLUSH_INTERVAL_MS);
    }

    private getMetadata() {
        return {
            platform: Platform.OS,
            appVersion: Constants.expoConfig?.version || 'unknown',
            deviceId: Constants.sessionId,
            timestamp: new Date().toISOString(),
        };
    }

    private async sendToServer(logs: any[]) {
        if (!this.enabled || logs.length === 0) return;

        try {
            await fetch(`${API_BASE_URL}/mobile/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logs,
                    metadata: this.getMetadata(),
                }),
            });
        } catch (error) {
            // Don't log this error to avoid infinite loop
            // console.error('Failed to send logs to server:', error);
        }
    }

    private addToBatch(level: string, message: string, data?: any) {
        const logEntry = {
            level,
            message,
            data,
            ...this.getMetadata(),
        };

        this.batchLogs.push(logEntry);

        // Flush if batch is full
        if (this.batchLogs.length >= this.BATCH_SIZE) {
            this.flush();
        }
    }

    private async flush() {
        if (this.batchLogs.length === 0) return;

        const logsToSend = [...this.batchLogs];
        this.batchLogs = [];

        await this.sendToServer(logsToSend);
    }

    log(message: string, data?: any) {
        console.log(`[APP] ${message}`, data || '');
        this.addToBatch('info', message, data);
    }

    info(message: string, data?: any) {
        console.info(`[INFO] ${message}`, data || '');
        this.addToBatch('info', message, data);
    }

    warn(message: string, data?: any) {
        console.warn(`[WARN] ${message}`, data || '');
        this.addToBatch('warn', message, data);
    }

    error(message: string, error?: any) {
        console.error(`[ERROR] ${message}`, error || '');
        this.addToBatch('error', message, {
            error: error?.message || error?.toString(),
            stack: error?.stack,
        });
    }

    debug(message: string, data?: any) {
        if (__DEV__) {
            console.debug(`[DEBUG] ${message}`, data || '');
            this.addToBatch('debug', message, data);
        }
    }

    // Navigation tracking
    trackScreen(screenName: string) {
        this.log(`Screen viewed: ${screenName}`);
    }

    // API tracking
    trackAPI(endpoint: string, method: string, status: number, duration: number) {
        this.log(`API ${method} ${endpoint} - ${status} (${duration}ms)`);
    }

    // User action tracking
    trackAction(action: string, data?: any) {
        this.log(`User action: ${action}`, data);
    }

    // Force flush logs (call on app background/close)
    async forceFlush() {
        await this.flush();
    }

    // Disable logging (e.g., for testing)
    disable() {
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
    }
}

export const logger = new MobileLogger();

// Override global console methods to also send to server
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
    originalLog(...args);
    if (args[0] && typeof args[0] === 'string') {
        logger.log(args[0], args.slice(1));
    }
};

console.error = (...args) => {
    originalError(...args);
    if (args[0]) {
        logger.error(typeof args[0] === 'string' ? args[0] : 'Error', args[0]);
    }
};

console.warn = (...args) => {
    originalWarn(...args);
    if (args[0] && typeof args[0] === 'string') {
        logger.warn(args[0], args.slice(1));
    }
};

export default logger;
