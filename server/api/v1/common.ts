import express from 'express';
import { db } from '../../db.js';
import { pushTokens } from '../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import type { Request, Response } from 'express';

const router = express.Router();

// Register/Update Push Token
router.post('/push-token', async (req: Request, res: Response) => {
    try {
        const { token, deviceType } = req.body;
        const user = req.user;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token is required'
            });
        }

        // Check if token already exists for this user/lead
        const existing = await db.query.pushTokens.findFirst({
            where: eq(pushTokens.token, token)
        });

        if (existing) {
            // Update mapping if user changed (or just update timestamp)
            await db.update(pushTokens)
                .set({
                    userId: user?.role !== 'parent' ? user?.userId : null,
                    leadId: user?.role === 'parent' ? user?.userId : null, // In this app, parent user ID is often linked to lead ID
                    updatedAt: new Date()
                })
                .where(eq(pushTokens.id, existing.id));
        } else {
            // Create new record
            await db.insert(pushTokens).values({
                userId: user?.role !== 'parent' ? user?.userId : null,
                leadId: user?.role === 'parent' ? user?.userId : null,
                token,
                deviceType: deviceType || 'unknown',
            });
        }

        res.json({
            success: true,
            message: 'Push token registered successfully'
        });
    } catch (error) {
        console.error('[Mobile API] Push token registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register push token'
        });
    }
});

export default router;
