import { Router, Request, Response } from 'express';
import { YouTubeService } from '../services/youtubeService';

const router = Router();

/**
 * GET /status
 * Check if the YouTube Data API is configured
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    isConfigured: YouTubeService.isConfigured(),
  });
});

/**
 * POST /find
 * Search YouTube for a single track
 */
router.post('/find', async (req: Request, res: Response) => {
  try {
    const { title, artist, album } = req.body;

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'Track title is required' });
      return;
    }

    const result = await YouTubeService.searchYouTube(title, artist, album);
    res.json(result);
  } catch (err: any) {
    console.error('[YouTube Route Error - /find]', err);
    res.status(500).json({
      status: 'video_not_found',
      candidates: [],
      error: err.message || 'Internal server error while finding YouTube video',
    });
  }
});

/**
 * POST /batch-find
 * Concurrently search YouTube for an array of tracks
 */
router.post('/batch-find', async (req: Request, res: Response) => {
  try {
    const { tracks } = req.body;

    if (!Array.isArray(tracks)) {
      res.status(400).json({ error: 'BadRequest', message: 'Tracks array is required' });
      return;
    }

    const results = await YouTubeService.batchSearchYouTube(tracks);
    res.json({ results });
  } catch (err: any) {
    console.error('[YouTube Route Error - /batch-find]', err);
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

/**
 * POST /parse-url
 * Validate and parse a custom YouTube video link
 */
router.post('/parse-url', (req: Request, res: Response) => {
  try {
    const { url, customTitle } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'Valid URL string is required' });
      return;
    }

    const video = YouTubeService.parseManualUrl(url, customTitle);
    if (!video) {
      res.status(400).json({
        valid: false,
        message: 'Could not extract a valid YouTube video ID from the provided URL.',
      });
      return;
    }

    res.json({ valid: true, video });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
