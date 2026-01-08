/**
 * Mobile Logs Endpoint
 * Receives logs from mobile app and outputs them to Vercel logs
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /api/mobile/logs
 * Receive mobile app logs and output to Vercel logs
 */
router.post('/logs', async (req: Request, res: Response) => {
    try {
        const { logs, metadata } = req.body;

        if (!logs || !Array.isArray(logs)) {
            return res.status(400).json({ error: 'Invalid logs format' });
        }

        // Output each log entry to Vercel logs
        logs.forEach((log: any) => {
            const prefix = `[MOBILE ${metadata.platform?.toUpperCase()}]`;
            const timestamp = new Date(log.timestamp).toISOString();
            const message = `${prefix} [${timestamp}] ${log.message}`;

            switch (log.level) {
                case 'error':
                    console.error(message, log.data || '');
                    break;
                case 'warn':
                    console.warn(message, log.data || '');
                    break;
                case 'debug':
                    console.debug(message, log.data || '');
                    break;
                default:
                    console.log(message, log.data || '');
            }
        });

        res.json({ success: true, received: logs.length });
    } catch (error) {
        console.error('[Mobile Logs] Error processing logs:', error);
        res.status(500).json({ error: 'Failed to process logs' });
    }
});

export default router;
