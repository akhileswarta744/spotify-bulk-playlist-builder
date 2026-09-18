import { Request, Response, NextFunction } from 'express';

// Extend Express Request type with Spotify token
declare global {
  namespace Express {
    interface Request {
      spotifyToken?: string;
    }
  }
}

export function requireSpotifyAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'A valid Spotify Bearer token is required. Please connect your Spotify account.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token is empty.',
    });
    return;
  }

  req.spotifyToken = token;
  next();
}
