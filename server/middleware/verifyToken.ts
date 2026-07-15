import { auth } from "../firebaseAdmin";
import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export async function verifyToken(req: any, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) 
    return res.status(401).json({ error: 'Missing authorization header' });

  const token = header.split('Bearer ')[1];
  
  // For AI Studio Development Sandbox / Guest Offline Mode
  if (process.env.NODE_ENV !== 'production' && (process.env.ALLOW_DEV_AUTH_BYPASS === 'true' || token === 'sandbox-developer-bypass-token')) {
    req.user = {
      uid: 'sandbox-dev-uid',
      email: 'sandbox@example.com',
      email_verified: true,
      role: 'admin',
      isAnonymous: false,
    };
    return next();
  }

  if (token.length < 100) {
    logger.error('Token verification failed: Token too short', { 
      tokenLength: token.length, 
      tokenPrefix: token.substring(0, 10) 
    });
    return res.status(401).json({ error: 'Malformed token: Token too short' });
  }
  
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
    // Role must come ONLY from Firebase custom claims going forward for security
    let userRole = req.user.role || (req.user.admin ? 'admin' : 'user');
    
    // For development testing, we can inject a bypass header or just rely on the token.
    // In production, this must match EXACTLY.
    if (!allowedRoles.includes(userRole)) {
       logger.error('RBAC Violation Attempt', { uid: req.user.uid, role: userRole, allowed: allowedRoles, path: req.originalUrl });
       return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    
    next();
  };
}


