import { Router, Request, Response } from 'express';
import { requireSpotifyAuth } from '../middleware/authMiddleware';
import { spotifyService } from '../services/spotifyService';
import { rankCandidates } from '../services/matcherService';
import { throttledMap } from '../utils/rateLimiter';
import { ParsedSong, MatchResult, BatchSearchResponse } from '../types';

const router = Router();

/**
 * POST /api/spotify/search
 * Batch search Spotify catalog for a list of parsed songs with intelligent matching and ranking.
 */
router.post('/search', requireSpotifyAuth, async (req: Request, res: Response) => {
  const { songs } = req.body;

  if (!Array.isArray(songs) || songs.length === 0) {
    res.status(400).json({
      error: 'Invalid Request',
      message: 'Body must include a non-empty array of "songs"',
    });
    return;
  }

  const token = req.spotifyToken!;

  try {
    // Run concurrent throttled search with rate-limit backoff (concurrency = 4)
    const matchResults: MatchResult[] = await throttledMap(
      songs as ParsedSong[],
      4,
      async (song: ParsedSong) => {
        // Construct targeted query: Title + Artist or Title + Movie
        let query = song.title.trim();
        if (song.artist && song.artist.trim()) {
          query = `${song.title.trim()} ${song.artist.trim()}`;
        } else if (song.movieContext && song.movieContext.trim()) {
          query = `${song.title.trim()} ${song.movieContext.trim()}`;
        }

        const tracks = await spotifyService.searchTracks(query, token, 5);

        // Fallback: If no tracks found and query had movie context, retry with title only
        if (tracks.length === 0 && song.movieContext) {
          const fallbackTracks = await spotifyService.searchTracks(song.title.trim(), token, 5);
          return rankCandidates(song, fallbackTracks);
        }

        return rankCandidates(song, tracks);
      }
    );

    // Compute summary
    const total = matchResults.length;
    let matched = 0;
    let needsReview = 0;
    let notFound = 0;

    for (const res of matchResults) {
      if (res.status === 'matched') matched++;
      else if (res.status === 'needs_review') needsReview++;
      else notFound++;
    }

    const duplicates = (songs as ParsedSong[]).filter((s) => s.isDuplicate).length;

    const response: BatchSearchResponse = {
      results: matchResults,
      summary: {
        total,
        matched,
        needsReview,
        notFound,
        duplicates,
      },
    };

    res.json(response);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const message = err?.response?.data?.error?.message || err?.message || 'Search failed';
    res.status(status).json({ error: 'SearchFailed', message });
  }
});

/**
 * GET /api/spotify/search-single
 * Single query live search for manual search fallback modal.
 */
router.get('/search-single', requireSpotifyAuth, async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query || !query.trim()) {
    res.status(400).json({ error: 'Invalid Request', message: 'Query param "q" is required' });
    return;
  }

  try {
    const tracks = await spotifyService.searchTracks(query.trim(), req.spotifyToken!, 10);
    res.json({ tracks });
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const message = err?.response?.data?.error?.message || err?.message || 'Search failed';
    res.status(status).json({ error: 'SearchFailed', message });
  }
});

/**
 * GET /api/spotify/playlists
 * Retrieve the user's Spotify playlists.
 */
router.get('/playlists', requireSpotifyAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, parseInt((req.query.limit as string) || '50', 10));
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const playlists = await spotifyService.getUserPlaylists(req.spotifyToken!, limit, offset);
    res.json(playlists);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const message =
      err?.response?.data?.error?.message || err?.message || 'Failed to fetch playlists';
    res.status(status).json({ error: 'PlaylistsError', message });
  }
});

/**
 * POST /api/spotify/playlists
 * Create a new Spotify playlist.
 */
router.post('/playlists', requireSpotifyAuth, async (req: Request, res: Response) => {
  const { name, description, isPublic } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({
      error: 'Invalid Request',
      message: 'Playlist name is required',
    });
    return;
  }

  const token = req.spotifyToken!;

  try {
    const user = await spotifyService.getCurrentUserProfile(token);
    const playlist = await spotifyService.createPlaylist(
      user.id,
      name.trim(),
      description || 'Created with Spotify Bulk Playlist Builder (Hukha Mar)',
      Boolean(isPublic),
      token
    );

    res.json(playlist);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const message =
      err?.response?.data?.error?.message || err?.message || 'Failed to create playlist';
    res.status(status).json({ error: 'CreatePlaylistError', message });
  }
});

/**
 * POST /api/spotify/playlists/add-tracks
 * Add tracks to a playlist strictly preserving original ordering.
 */
router.post('/playlists/add-tracks', requireSpotifyAuth, async (req: Request, res: Response) => {
  const { playlistId, trackUris } = req.body;

  if (!playlistId || !Array.isArray(trackUris) || trackUris.length === 0) {
    res.status(400).json({
      error: 'Invalid Request',
      message: 'Body must include playlistId and non-empty trackUris array',
    });
    return;
  }

  try {
    const result = await spotifyService.addTracksToPlaylist(
      playlistId,
      trackUris,
      req.spotifyToken!
    );
    res.json(result);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const message =
      err?.response?.data?.error?.message || err?.message || 'Failed to add tracks';
    res.status(status).json({ error: 'AddTracksError', message });
  }
});

export default router;
