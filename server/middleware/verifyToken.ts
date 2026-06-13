import { auth } from "../firebaseAdmin";
import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export async function verifyToken(req: any, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) 
    return res.status(401).json({ error: 'Missing authorization header' });

  const token = header.split('Bearer ')[1];
  
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    logger.error('Token verification failed', { 
      tokenLength: token?.length, 
      error: err.message 
    });
    return res.status(401).json({ error: 'Invalid token' });
  }
}

