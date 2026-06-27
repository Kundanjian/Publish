import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
};
