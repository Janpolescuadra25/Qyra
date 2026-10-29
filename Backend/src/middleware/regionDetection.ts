import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userRegion?: string;
    }
  }
}

export function regionDetectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerRegion = (req.headers['x-user-region'] as string) || (req.headers['cf-ipcountry'] as string);
  
  if (headerRegion) {
    const normalized = headerRegion.toLowerCase().trim();
    if (['us', 'ca', 'mx'].includes(normalized)) {
      req.userRegion = 'us-east';
    } else if (['gb', 'de', 'fr', 'es', 'nl', 'ie'].includes(normalized)) {
      req.userRegion = 'eu-west';
    } else if (['sg', 'jp', 'au', 'in', 'kr'].includes(normalized)) {
      req.userRegion = 'ap-southeast';
    } else {
      req.userRegion = normalized;
    }
  } else {
    req.userRegion = process.env.DATABASE_DEFAULT_REGION || 'us-east';
  }

  next();
}