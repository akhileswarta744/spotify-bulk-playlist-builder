import axios from 'axios';
import { YouTubeResult, YouTubeVideo, YouTubeBadge } from '../types';

// In-memory cache to save API quota during sessions
const youtubeCache = new Map<string, YouTubeResult>();

// Major record labels list for prioritizing official label uploads
const KNOWN_LABELS = [
  't-series',
  'tseries',
  'sony music',
  'zee music',
  'yrf',
  'yash raj films',
  'tips official',
  'tips music',
  'tips films',
  'saregama',
  'speed records',
  'eros now',
  'vevo',
  'warner music',
  'universal music',
  'atlantic records',
  'columbia records',
  'def jam',
  'interscope',
  'rca records',
  'spinnin',
  'monstercat',
  'geffen',
  'bad boy',
  'aditya music',
  'lahari music',
];

/**
 * Clean up HTML entities often returned in YouTube video snippets
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

/**
 * Validates and extracts 11-char YouTube Video ID from any standard URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Handle direct video ID passed
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex handles youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, music.youtube.com/watch?v=
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
  );

  return match ? match[1] : null;
}

/**
 * Evaluates candidates and returns score and badge
 */
export function scoreYouTubeVideo(
  itemTitle: string,
  channelTitle: string,
  expectedTitle: string,
  expectedArtist?: string
): { score: number; badge: YouTubeBadge } {
  let score = 50;
  let badge: YouTubeBadge = 'Other';

  const tLower = itemTitle.toLowerCase();
  const cLower = channelTitle.toLowerCase();
  const expTLower = expectedTitle.toLowerCase();
  const expALower = expectedArtist ? expectedArtist.toLowerCase() : '';

  // 1. Official Music Video check (+50 pts)
  const isOfficialVideo =
    tLower.includes('official music video') ||
    tLower.includes('official video') ||
    tLower.includes('full video song') ||
    tLower.includes('official visualizer');

  // 2. Official Audio check (+40 pts)
  const isOfficialAudio =
    tLower.includes('official audio') ||
    tLower.includes('- audio') ||
    tLower.includes('(audio)') ||
    cLower.endsWith(' - topic') ||
    cLower.endsWith('- topic');

  // 3. Official Label check (+30 pts)
  const isLabel = KNOWN_LABELS.some((label) => cLower.includes(label));

  // Determine badge and score boost
  if (isOfficialVideo) {
    score += 50;
    badge = 'Official Music Video';
  } else if (isOfficialAudio) {
    score += 40;
    badge = 'Official Audio';
  } else if (isLabel) {
    score += 30;
    badge = 'Label Upload';
  }

  // Bonus for title and artist matches in snippet
  if (tLower.includes(expTLower)) {
    score += 25;
  }

  if (expALower) {
    const artistKeywords = expALower
      .split(/[,/&]/)
      .map((k) => k.trim())
      .filter(Boolean);
    const anyArtistMatch = artistKeywords.some(
      (a) => tLower.includes(a) || cLower.includes(a)
    );
    if (anyArtistMatch) {
      score += 20;
    }
  }

  // Penalties: Avoid covers, reactions, karaoke, shorts, parodies
  if (tLower.includes('cover') || tLower.includes('covered by')) {
    score -= 80;
  }
  if (tLower.includes('reaction') || tLower.includes('reacts') || tLower.includes('reacting')) {
    score -= 80;
  }
  if (tLower.includes('karaoke') || tLower.includes('instrumental') || tLower.includes('backing track')) {
    score -= 50;
  }
  if (tLower.includes('fan made') || tLower.includes('fan video') || tLower.includes('fan edit')) {
    score -= 60;
  }
  if (tLower.includes('parody')) {
    score -= 60;
  }
  if (tLower.includes('shorts') || tLower.includes('#shorts') || tLower.includes('status')) {
    score -= 60;
  }
  if (tLower.includes('dance cover') || tLower.includes('choreography')) {
    score -= 40;
  }
  if (tLower.includes('live performance') || tLower.includes('live at') || tLower.includes('live in')) {
    score -= 20;
  }

  return { score, badge };
}

export class YouTubeService {
  /**
   * Check if the official YouTube Data API key is available
   */
  public static isConfigured(): boolean {
    return Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.trim() !== '');
  }

  /**
   * Construct the search query from track information
   * Format: "Title Artist Album" (e.g. "Tu Meri Vishal Dadlani Bang Bang")
   */
  public static buildSearchQuery(title: string, artist?: string, album?: string): string {
    const parts: string[] = [title.trim()];
    if (artist && artist.trim()) {
      parts.push(artist.trim());
    }
    if (album && album.trim() && album.trim().toLowerCase() !== title.trim().toLowerCase()) {
      parts.push(album.trim());
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Search YouTube for a song using official YouTube Data API v3
   */
  public static async searchYouTube(
    title: string,
    artist?: string,
    album?: string
  ): Promise<YouTubeResult> {
    const query = this.buildSearchQuery(title, artist, album);
    const cacheKey = query.toLowerCase();

    // 1. Check in-memory session cache
    if (youtubeCache.has(cacheKey)) {
      return youtubeCache.get(cacheKey)!;
    }

    // 2. Check if API key is configured
    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (!apiKey) {
      const fallbackResult: YouTubeResult = {
        status: 'video_not_found',
        candidates: [],
        searchQuery: query,
        error: 'YouTube API Key not configured. You can use manual search or paste a link.',
      };
      return fallbackResult;
    }

    try {
      // 3. Query YouTube Data API v3
      // Endpoint: https://www.googleapis.com/youtube/v3/search
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          type: 'video',
          videoCategoryId: '10', // Music category
          maxResults: 5,
          q: query,
          key: apiKey,
        },
        timeout: 10000,
      });

      let items = response.data?.items || [];

      // If no items found with category 10, fallback to general search query
      if (items.length === 0) {
        const fallbackSearch = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            type: 'video',
            maxResults: 5,
            q: query,
            key: apiKey,
          },
          timeout: 10000,
        });
        items = fallbackSearch.data?.items || [];
      }

      if (items.length === 0) {
        const notFoundResult: YouTubeResult = {
          status: 'video_not_found',
          candidates: [],
          searchQuery: query,
        };
        youtubeCache.set(cacheKey, notFoundResult);
        return notFoundResult;
      }

      // 4. Map & rank candidates
      const candidates: YouTubeVideo[] = items
        .filter((item: any) => item.id?.videoId)
        .map((item: any) => {
          const videoId = item.id.videoId;
          const rawTitle = item.snippet?.title || 'Unknown Title';
          const rawChannel = item.snippet?.channelTitle || 'Unknown Channel';
          const cleanTitle = decodeHtmlEntities(rawTitle);
          const cleanChannel = decodeHtmlEntities(rawChannel);

          const { score, badge } = scoreYouTubeVideo(
            cleanTitle,
            cleanChannel,
            title,
            artist
          );

          const thumbnailUrl =
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

          return {
            videoId,
            title: cleanTitle,
            channelTitle: cleanChannel,
            thumbnailUrl,
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            publishedAt: item.snippet?.publishedAt,
            badge,
            rankScore: score,
          };
        });

      // Sort descending by score
      candidates.sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));

      if (candidates.length === 0) {
        const notFoundResult: YouTubeResult = {
          status: 'video_not_found',
          candidates: [],
          searchQuery: query,
        };
        youtubeCache.set(cacheKey, notFoundResult);
        return notFoundResult;
      }

      const status = candidates.length > 1 ? 'multiple_videos' : 'video_found';
      const result: YouTubeResult = {
        status,
        selectedVideo: candidates[0],
        candidates,
        searchQuery: query,
      };

      // Cache for session
      youtubeCache.set(cacheKey, result);
      return result;
    } catch (err: any) {
      console.warn(`[YouTube Service] Search error for query "${query}":`, err?.response?.data?.error?.message || err.message);

      const errorMessage =
        err?.response?.data?.error?.message ||
        'Failed to query YouTube API. You can search manually or paste a link.';

      const failureResult: YouTubeResult = {
        status: 'video_not_found',
        candidates: [],
        searchQuery: query,
        error: errorMessage,
      };

      return failureResult;
    }
  }

  /**
   * Batch search for an array of songs with concurrency limit to preserve resources
   */
  public static async batchSearchYouTube(
    tracks: Array<{ id: string; title: string; artist?: string; album?: string }>
  ): Promise<Record<string, YouTubeResult>> {
    const results: Record<string, YouTubeResult> = {};
    const concurrency = 4;

    for (let i = 0; i < tracks.length; i += concurrency) {
      const slice = tracks.slice(i, i + concurrency);
      await Promise.all(
        slice.map(async (track) => {
          try {
            const res = await this.searchYouTube(track.title, track.artist, track.album);
            results[track.id] = res;
          } catch {
            results[track.id] = {
              status: 'video_not_found',
              candidates: [],
              searchQuery: this.buildSearchQuery(track.title, track.artist, track.album),
            };
          }
        })
      );
    }

    return results;
  }

  /**
   * Parse a manual YouTube URL entered by user
   */
  public static parseManualUrl(url: string, customTitle?: string): YouTubeVideo | null {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return null;

    return {
      videoId,
      title: customTitle || `YouTube Video (${videoId})`,
      channelTitle: 'Custom Selection',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      badge: 'Other',
      rankScore: 100,
    };
  }

  /**
   * Clear in-memory cache (primarily for testing)
   */
  public static clearCache(): void {
    youtubeCache.clear();
  }
}
