import { Router, Request, Response } from 'express';
import { spotifyService } from '../services/spotifyService';
import { requireSpotifyAuth } from '../middleware/authMiddleware';

const router = Router();

/**
 * GET /api/auth/config
 * Provides public client configuration needed for PKCE initiation.
 */
router.get('/config', (req: Request, res: Response) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const dynamicRedirect = host ? `${protocol}://${host}/callback` : 'http://127.0.0.1:5173/callback';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || dynamicRedirect;
  const isConfigured = Boolean(clientId && clientId !== 'your_spotify_client_id_here');

  res.json({
    clientId,
    redirectUri,
    isConfigured,
  });
});

/**
 * POST /api/auth/token
 * Completes Authorization Code with PKCE token exchange.
 */
router.post('/token', async (req: Request, res: Response) => {
  const { code, codeVerifier, redirectUri } = req.body;

  if (!code || !codeVerifier) {
    res.status(400).json({
      error: 'Invalid Request',
      message: 'Missing code or codeVerifier in request body',
    });
    return;
  }

  const effectiveRedirect = redirectUri || process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback';

  try {
    const tokens = await spotifyService.exchangeCodeForTokens(
      code,
      codeVerifier,
      effectiveRedirect
    );
    res.json(tokens);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const message =
      err?.response?.data?.error_description ||
      err?.response?.data?.error ||
      err?.message ||
      'Token exchange failed';
    res.status(status).json({ error: 'AuthFailed', message });
  }
});

/**
 * POST /api/auth/refresh
 * Refreshes an expired access token using refresh_token.
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({
      error: 'Invalid Request',
      message: 'Missing refreshToken in request body',
    });
    return;
  }

  try {
    const tokens = await spotifyService.refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const message =
      err?.response?.data?.error_description ||
      err?.response?.data?.error ||
      err?.message ||
      'Token refresh failed';
    res.status(status).json({ error: 'RefreshFailed', message });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated Spotify user profile.
 */
router.get('/me', requireSpotifyAuth, async (req: Request, res: Response) => {
  try {
    const profile = await spotifyService.getCurrentUserProfile(req.spotifyToken!);
    res.json(profile);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const message =
      err?.response?.data?.error?.message ||
      err?.message ||
      'Failed to fetch user profile';
    res.status(status).json({ error: 'ProfileError', message });
  }
});

export default router;
