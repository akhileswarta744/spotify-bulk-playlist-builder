import axios, { AxiosError } from 'axios';
import {
  SpotifyTrack,
  SpotifySearchTracksResponse,
  SpotifyUserProfile,
  SpotifyPlaylist,
  SpotifyPaginatedResponse,
  SpotifyTokenResponse,
} from '../types/spotify';
import { sleep } from '../utils/rateLimiter';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com/api';

export class SpotifyService {
  private get clientId(): string {
    return process.env.SPOTIFY_CLIENT_ID || '';
  }

  private get clientSecret(): string | undefined {
    return process.env.SPOTIFY_CLIENT_SECRET || undefined;
  }

  constructor() {}

  /**
   * Exchange OAuth authorization code + PKCE code_verifier for Spotify access & refresh tokens.
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<SpotifyTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (this.clientSecret) {
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }

    try {
      const response = await axios.post<SpotifyTokenResponse>(
        `${SPOTIFY_ACCOUNTS_BASE}/token`,
        params.toString(),
        { headers }
      );
      return response.data;
    } catch (err: any) {
      this.handleSpotifyAuthError(err, 'Token exchange failed');
      throw err;
    }
  }

  /**
   * Refresh expired access token using refresh_token.
   */
  async refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (this.clientSecret) {
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }

    try {
      const response = await axios.post<SpotifyTokenResponse>(
        `${SPOTIFY_ACCOUNTS_BASE}/token`,
        params.toString(),
        { headers }
      );
      return response.data;
    } catch (err: any) {
      this.handleSpotifyAuthError(err, 'Token refresh failed');
      throw err;
    }
  }

  /**
   * Get the current authenticated user's Spotify profile.
   */
  async getCurrentUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
    const response = await this.executeWithBackoff<SpotifyUserProfile>(() =>
      axios.get(`${SPOTIFY_API_BASE}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );
    return response;
  }

  /**
   * Search Spotify catalogue for tracks.
   */
  async searchTracks(
    query: string,
    accessToken: string,
    limit: number = 5
  ): Promise<SpotifyTrack[]> {
    if (!query || !query.trim()) return [];

    const response = await this.executeWithBackoff<SpotifySearchTracksResponse>(() =>
      axios.get(`${SPOTIFY_API_BASE}/search`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: query.trim(),
          type: 'track',
          limit,
        },
      })
    );

    return response.tracks?.items || [];
  }

  /**
   * Get user's existing Spotify playlists with pagination.
   */
  async getUserPlaylists(
    accessToken: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<SpotifyPaginatedResponse<SpotifyPlaylist>> {
    const response = await this.executeWithBackoff<SpotifyPaginatedResponse<SpotifyPlaylist>>(() =>
      axios.get(`${SPOTIFY_API_BASE}/me/playlists`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, offset },
      })
    );
    return response;
  }

  /**
   * Create a new playlist for the user.
   */
  async createPlaylist(
    userId: string,
    name: string,
    description: string = 'Created with Spotify Bulk Playlist Builder (Hukha Mar)',
    isPublic: boolean = false,
    accessToken: string
  ): Promise<SpotifyPlaylist> {
    const payload = {
      name,
      description,
      public: isPublic,
    };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Try encoded userId endpoint first, fallback to /v1/me/playlists
    try {
      const encodedUserId = encodeURIComponent(userId.trim());
      const response = await this.executeWithBackoff<SpotifyPlaylist>(() =>
        axios.post(`${SPOTIFY_API_BASE}/users/${encodedUserId}/playlists`, payload, { headers })
      );
      return response;
    } catch (err: any) {
      console.warn('[SpotifyService] Primary playlist endpoint failed, trying /v1/me/playlists fallback...', err?.response?.status);
      const response = await this.executeWithBackoff<SpotifyPlaylist>(() =>
        axios.post(`${SPOTIFY_API_BASE}/me/playlists`, payload, { headers })
      );
      return response;
    }
  }

  /**
   * Add tracks to playlist in chunks of 100 preserving exact original order.
   */
  async addTracksToPlaylist(
    playlistId: string,
    trackUris: string[],
    accessToken: string,
    onProgress?: (addedCount: number, total: number) => void
  ): Promise<{ success: boolean; totalAdded: number }> {
    if (!trackUris || trackUris.length === 0) {
      return { success: true, totalAdded: 0 };
    }

    const CHUNK_SIZE = 100; // Spotify max tracks per add-tracks request
    let addedCount = 0;

    for (let i = 0; i < trackUris.length; i += CHUNK_SIZE) {
      const chunk = trackUris.slice(i, i + CHUNK_SIZE);

      const encodedPlaylistId = encodeURIComponent(playlistId.trim());
      await this.executeWithBackoff(() =>
        axios.post(
          `${SPOTIFY_API_BASE}/playlists/${encodedPlaylistId}/tracks`,
          { uris: chunk },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      addedCount += chunk.length;
      if (onProgress) {
        onProgress(addedCount, trackUris.length);
      }
    }

    return { success: true, totalAdded: addedCount };
  }

  /**
   * Generic executor with Spotify 429 Retry-After and transient error backoff.
   */
  private async executeWithBackoff<T>(fn: () => Promise<{ data: T }>): Promise<T> {
    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
      try {
        const result = await fn();
        return result.data;
      } catch (error: any) {
        attempts++;
        const status = error?.response?.status;
        const retryAfter = error?.response?.headers?.['retry-after'];

        if (status === 429) {
          const waitMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : Math.min(1000 * Math.pow(2, attempts), 10000);
          console.warn(`[Spotify API] Rate limited (429). Retrying in ${waitMs}ms...`);
          await sleep(waitMs);
          continue;
        }

        // Retry on 5xx transient server errors
        if (status >= 500 && status < 600 && attempts < maxAttempts) {
          const waitMs = 1000 * Math.pow(2, attempts);
          console.warn(`[Spotify API] Server error (${status}). Retrying in ${waitMs}ms...`);
          await sleep(waitMs);
          continue;
        }

        this.formatSpotifyError(error);
        throw error;
      }
    }

    throw new Error('Max retries exceeded for Spotify API request');
  }

  private handleSpotifyAuthError(err: AxiosError | any, context: string): void {
    const data = err?.response?.data;
    const message = data?.error_description || data?.error || err?.message || 'Unknown auth error';
    console.error(`[Spotify OAuth] ${context}:`, message);
  }

  private formatSpotifyError(err: AxiosError | any): void {
    console.error(`[Spotify API Error] Status: ${err?.response?.status}`, JSON.stringify(err?.response?.data || err?.message));
  }
}

export const spotifyService = new SpotifyService();
