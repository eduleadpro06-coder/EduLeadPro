/**
 * Mobile API v1 - Main Router
 * Mounts all mobile API v1 endpoints with JWT authentication
 */

import express from 'express';
import { refreshTokenHandler } from '../../middleware/auth.js';
import parentRouter from './parent.js';
import teacherRouter from './teacher.js';
import driverRouter from './driver.js';
import commonRouter from './common.js';
import teacherAssignments from './teacher-assignments.js';

import authRouter from './auth.js';

const router = express.Router();

// Mount mobile auth endpoints
router.use('/auth', authRouter);

// Auth endpoint - token refresh (legacy/direct access if needed)
router.post('/auth/refresh-token', refreshTokenHandler);

// Mount role-specific routers
router.use('/parent', parentRouter);
router.use('/teacher', teacherRouter);
router.use('/driver', driverRouter);
router.use('/common', commonRouter);
router.use('/teacher-assignments', teacherAssignments);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            version: 'v1',
            timestamp: new Date().toISOString()
        }
    });
});

export default router;
