import axios from 'axios';
import {
  SpotifyUserProfile,
  SpotifyPlaylist,
  SpotifyTrack,
  ParsedSong,
  BatchSearchResponse,
  YouTubeResult,
  YouTubeVideo,
} from '../types';

const API_BASE = '/api';

export const api = {
  async getAuthConfig(): Promise<{ clientId: string; redirectUri: string; isConfigured: boolean }> {
    const res = await axios.get(`${API_BASE}/auth/config`);
    return res.data;
  },

  async exchangeCodeForTokens(code: string, codeVerifier: string, redirectUri: string) {
    const res = await axios.post(`${API_BASE}/auth/token`, {
      code,
      codeVerifier,
      redirectUri,
    });
    return res.data;
  },

  async refreshTokens(refreshToken: string) {
    const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
    return res.data;
  },

  async getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
    const res = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  },

  async parseSongs(
    text: string,
    useAi: boolean = false
  ): Promise<{ songs: ParsedSong[]; totalDetected: number; duplicatesCount: number; source: string }> {
    const res = await axios.post(`${API_BASE}/parser/parse`, { text, useAi });
    return res.data;
  },

  async deduplicateSongs(songs: ParsedSong[]): Promise<{ songs: ParsedSong[]; count: number }> {
    const res = await axios.post(`${API_BASE}/parser/deduplicate`, { songs });
    return res.data;
  },

  async getDefaultPlaylist(): Promise<{ tracks: string[]; count: number; text: string }> {
    const res = await axios.get(`${API_BASE}/parser/default-playlist`);
    return res.data;
  },

  async getAiStatus(): Promise<{ available: boolean }> {
    const res = await axios.get(`${API_BASE}/parser/ai-status`);
    return res.data;
  },

  async batchSearchSpotify(
    songs: ParsedSong[],
    accessToken: string
  ): Promise<BatchSearchResponse> {
    const res = await axios.post(
      `${API_BASE}/spotify/search`,
      { songs },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.data;
  },

  async manualSearchSpotify(query: string, accessToken: string): Promise<SpotifyTrack[]> {
    const res = await axios.get(`${API_BASE}/spotify/search-single`, {
      params: { q: query },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data.tracks || [];
  },

  async getUserPlaylists(accessToken: string): Promise<{ items: SpotifyPlaylist[]; total: number }> {
    const res = await axios.get(`${API_BASE}/spotify/playlists`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  },

  async createPlaylist(
    name: string,
    description: string,
    isPublic: boolean,
    accessToken: string
  ): Promise<SpotifyPlaylist> {
    const res = await axios.post(
      `${API_BASE}/spotify/playlists`,
      { name, description, isPublic },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.data;
  },

  async addTracksToPlaylist(
    playlistId: string,
    trackUris: string[],
    accessToken: string
  ): Promise<{ success: boolean; totalAdded: number }> {
    const res = await axios.post(
      `${API_BASE}/spotify/playlists/add-tracks`,
      { playlistId, trackUris },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.data;
  },

  async getYouTubeStatus(): Promise<{ isConfigured: boolean }> {
    const res = await axios.get(`${API_BASE}/youtube/status`);
    return res.data;
  },

  async findYouTube(title: string, artist?: string, album?: string): Promise<YouTubeResult> {
    const res = await axios.post(`${API_BASE}/youtube/find`, {
      title,
      artist,
      album,
    });
    return res.data;
  },

  async batchFindYouTube(
    tracks: Array<{ id: string; title: string; artist?: string; album?: string }>
  ): Promise<{ results: Record<string, YouTubeResult> }> {
    const res = await axios.post(`${API_BASE}/youtube/batch-find`, { tracks });
    return res.data;
  },

  async parseManualYouTubeUrl(
    url: string,
    customTitle?: string
  ): Promise<{ valid: boolean; video?: YouTubeVideo; message?: string }> {
    const res = await axios.post(`${API_BASE}/youtube/parse-url`, { url, customTitle });
    return res.data;
  },
};

