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

export function requireRole(requiredRole: string | string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // Rely on Firebase Custom Claims (role claim)
    let userRole = req.user.role || (req.user.admin ? 'admin' : 'user');
    
    // Auto-grant admin to the developer email for AI Studio preview
    if (req.user.email === '4261164@myuwc.ac.za' || req.user.uid === 'q8i1F0a4i5er1dvWI7xljYkwaSH2') {
       userRole = 'admin';
       req.user.role = 'admin';
    }
    
    // For development testing, we can inject a bypass header or just rely on the token.
    // In production, this must match EXACTLY.
    if (!allowedRoles.includes(userRole)) {
       logger.error('RBAC Violation Attempt', { uid: req.user.uid, role: userRole, allowed: allowedRoles, path: req.originalUrl });
       return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    
    next();
  };
}

