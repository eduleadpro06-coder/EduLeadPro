import { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  res.status(200).json({
    message: 'EduConnect API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
} 