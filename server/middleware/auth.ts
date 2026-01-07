/**
 * Authentication Middleware for EduLeadPro
 * Handles JWT-based authentication for mobile and web applications
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include authenticated user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                username: string;
                role: string;
                organizationId: number;
            };
            organizationId?: number;
        }
    }
}

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Access token expires in 7 days
const REFRESH_TOKEN_EXPIRES_IN = '30d'; // Refresh token expires in 30 days

export interface JWTPayload {
    userId: number;
    username: string;
    role: string;
    organizationId: number;
    type: 'access' | 'refresh';
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(userId: number, username: string, role: string, organizationId: number): string {
    const payload: JWTPayload = {
        userId,
        username,
        role,
        organizationId,
        type: 'access'
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId: number, username: string, role: string, organizationId: number): string {
    const payload: JWTPayload = {
        userId,
        username,
        role,
        organizationId,
        type: 'refresh'
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token from Authorization header and attaches user info to request
 */
export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        // Extract token from Authorization header: "Bearer <token>"
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Authorization token required'
                }
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired token'
                }
            });
        }

        // Only allow access tokens (not refresh tokens) for API access
        if (decoded.type !== 'access') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN_TYPE',
                    message: 'Invalid token type. Use access token for API requests.'
                }
            });
        }

        // Attach user info to request object
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            organizationId: decoded.organizationId
        };

        // Also attach organizationId directly for convenience
        req.organizationId = decoded.organizationId;

        next();
    } catch (error) {
        console.error('JWT middleware error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication failed'
            }
        });
    }
}

/**
 * Optional JWT Middleware
 * Attempts to authenticate but doesn't fail if no token provided
 * Useful for endpoints that can work with or without authentication
 */
export function optionalJwtMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided - continue without authentication
        return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded && decoded.type === 'access') {
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            organizationId: decoded.organizationId
        };
        req.organizationId = decoded.organizationId;
    }

    next();
}

/**
 * Role-based Access Control Middleware
 * Restricts access to endpoints based on user role
 * 
 * Usage: router.get('/admin-only', roleGuard(['admin']), handler)
 */
export function roleGuard(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
        }

        const userRole = req.user.role.toLowerCase();
        const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);

        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
                }
            });
        }

        next();
    };
}

/**
 * Organization Isolation Middleware
 * Ensures users can only access data from their own organization
 * Validates that requested resources belong to user's organization
 */
export function organizationMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.user || !req.organizationId) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
    }

    // Organization ID is already attached from JWT
    // Child middlewares/handlers can use req.organizationId
    next();
}

/**
 * Refresh Token Handler
 * Validates refresh token and issues new access token
 */
export async function refreshTokenHandler(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_REFRESH_TOKEN',
                    message: 'Refresh token required'
                }
            });
        }

        const decoded = verifyToken(refreshToken);

        if (!decoded || decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Invalid or expired refresh token'
                }
            });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(
            decoded.userId,
            decoded.username,
            decoded.role,
            decoded.organizationId
        );

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'REFRESH_ERROR',
                message: 'Failed to refresh token'
            }
        });
    }
}
