import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory or current directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import authRoutes from './routes/authRoutes';
import parserRoutes from './routes/parserRoutes';
import spotifyRoutes from './routes/spotifyRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Setup CORS to accept requests from frontend (both 127.0.0.1 and localhost)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    project: 'Spotify Bulk Playlist Builder',
    codename: 'Hukha Mar',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/parser', parserRoutes);
app.use('/api/spotify', spotifyRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'NotFound', message: 'API route not found' });
});

// Centralized Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: 'ServerError', message });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🎵 Spotify Bulk Playlist Builder (Hukha Mar) Server`);
    console.log(`🚀 Server listening on http://127.0.0.1:${PORT}`);
    console.log(`🔗 Spotify Client ID configured: ${Boolean(process.env.SPOTIFY_CLIENT_ID)}`);
    console.log(`====================================================`);
  });
}

export default app;
