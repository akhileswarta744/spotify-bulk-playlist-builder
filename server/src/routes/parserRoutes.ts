import { Router, Request, Response } from 'express';
import {
  parseSongList,
  removeDuplicatesPreservingOrder,
  DEFAULT_TEST_TRACKS,
} from '../services/normalizerService';
import { aiService } from '../services/aiService';

const router = Router();

/**
 * POST /api/parser/parse
 * Parse raw text into structured ParsedSong items with duplicate detection.
 */
router.post('/parse', async (req: Request, res: Response) => {
  const { text, useAi } = req.body;

  if (typeof text !== 'string') {
    res.status(400).json({
      error: 'Invalid Request',
      message: 'Body must include "text" string property',
    });
    return;
  }

  // If AI requested and available, attempt AI normalization
  if (useAi && aiService.available) {
    const rawLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const aiResult = await aiService.normalizeSongLines(rawLines);
    if (aiResult && aiResult.length > 0) {
      const duplicatesCount = aiResult.filter((s) => s.isDuplicate).length;
      res.json({
        songs: aiResult,
        totalDetected: aiResult.length,
        duplicatesCount,
        source: 'ai',
      });
      return;
    }
  }

  // Deterministic rule-based parser
  const songs = parseSongList(text);
  const duplicatesCount = songs.filter((s) => s.isDuplicate).length;

  res.json({
    songs,
    totalDetected: songs.length,
    duplicatesCount,
    source: 'deterministic',
  });
});

/**
 * POST /api/parser/deduplicate
 * Removes duplicates while strictly preserving the first occurrence and order.
 */
router.post('/deduplicate', (req: Request, res: Response) => {
  const { songs } = req.body;

  if (!Array.isArray(songs)) {
    res.status(400).json({
      error: 'Invalid Request',
      message: 'Body must include "songs" array',
    });
    return;
  }

  const deduplicated = removeDuplicatesPreservingOrder(songs);
  res.json({
    songs: deduplicated,
    count: deduplicated.length,
  });
});

/**
 * GET /api/parser/default-playlist
 * Returns the exact 50 default Bollywood tracks (strictly without Zaalima, includes Chammak Challo).
 */
router.get('/default-playlist', (_req: Request, res: Response) => {
  res.json({
    tracks: DEFAULT_TEST_TRACKS,
    count: DEFAULT_TEST_TRACKS.length,
    text: DEFAULT_TEST_TRACKS.join('\n'),
  });
});

/**
 * GET /api/parser/ai-status
 * Returns whether Gemini AI normalization is available.
 */
router.get('/ai-status', (_req: Request, res: Response) => {
  res.json({
    available: aiService.available,
  });
});

export default router;
