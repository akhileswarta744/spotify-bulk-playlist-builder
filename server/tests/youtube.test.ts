import { describe, it, expect, beforeEach } from 'vitest';
import {
  scoreYouTubeVideo,
  extractYouTubeVideoId,
  decodeHtmlEntities,
  YouTubeService,
} from '../src/services/youtubeService';

describe('YouTube Service & Ranking Engine', () => {
  describe('extractYouTubeVideoId', () => {
    it('extracts video ID from standard watch URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=YQHsXMglC9A&feature=share')).toBe('YQHsXMglC9A');
    });

    it('extracts video ID from short youtu.be URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts video ID from youtube shorts URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts video ID from music.youtube.com URL', () => {
      expect(extractYouTubeVideoId('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('accepts direct 11-character video ID', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('returns null for invalid URLs', () => {
      expect(extractYouTubeVideoId('https://google.com')).toBeNull();
      expect(extractYouTubeVideoId('not a url')).toBeNull();
      expect(extractYouTubeVideoId('')).toBeNull();
    });
  });

  describe('decodeHtmlEntities', () => {
    it('decodes HTML entities correctly', () => {
      expect(decodeHtmlEntities('Tu Meri &#39;Official&#39; &amp; Video &quot;HD&quot;')).toBe(
        `Tu Meri 'Official' & Video "HD"`
      );
    });
  });

  describe('scoreYouTubeVideo ranking', () => {
    it('prioritizes Official Music Video over covers and reactions', () => {
      const official = scoreYouTubeVideo(
        'Tu Meri Official Music Video | Bang Bang | Hrithik Roshan, Katrina Kaif | Vishal Dadlani',
        'Zee Music Company',
        'Tu Meri',
        'Vishal Dadlani'
      );

      const cover = scoreYouTubeVideo(
        'Tu Meri - Acoustic Guitar Cover by John Doe',
        'John Doe Music',
        'Tu Meri',
        'Vishal Dadlani'
      );

      const reaction = scoreYouTubeVideo(
        'American Reacts to Tu Meri Bang Bang Song!',
        'React Channel',
        'Tu Meri',
        'Vishal Dadlani'
      );

      expect(official.score).toBeGreaterThan(cover.score);
      expect(official.score).toBeGreaterThan(reaction.score);
      expect(official.badge).toBe('Official Music Video');
      expect(cover.score).toBeLessThan(0);
      expect(reaction.score).toBeLessThan(0);
    });

    it('identifies Official Audio and Topic channels', () => {
      const audio = scoreYouTubeVideo(
        'Chammak Challo (Official Audio)',
        'Akon - Topic',
        'Chammak Challo',
        'Akon'
      );

      expect(audio.badge).toBe('Official Audio');
      expect(audio.score).toBeGreaterThan(100);
    });

    it('identifies Label Uploads for verified label channels', () => {
      const label = scoreYouTubeVideo(
        'Kesariya - Brahmāstra',
        'Sony Music India',
        'Kesariya',
        'Arijit Singh'
      );

      expect(label.badge).toBe('Label Upload');
      expect(label.score).toBeGreaterThan(70);
    });
  });

  describe('YouTubeService graceful fallbacks', () => {
    beforeEach(() => {
      YouTubeService.clearCache();
    });

    it('builds search query preserving title, artist, album', () => {
      const query = YouTubeService.buildSearchQuery('Tu Meri', 'Vishal Dadlani', 'Bang Bang');
      expect(query).toBe('Tu Meri Vishal Dadlani Bang Bang');
    });

    it('returns graceful fallback when API key is not configured', async () => {
      const originalKey = process.env.YOUTUBE_API_KEY;
      delete process.env.YOUTUBE_API_KEY;

      const result = await YouTubeService.searchYouTube('Tu Meri', 'Vishal Dadlani', 'Bang Bang');
      expect(result.status).toBe('video_not_found');
      expect(result.candidates).toEqual([]);
      expect(result.searchQuery).toBe('Tu Meri Vishal Dadlani Bang Bang');
      expect(result.error).toBeDefined();

      process.env.YOUTUBE_API_KEY = originalKey;
    });

    it('parses manual YouTube URL correctly', () => {
      const video = YouTubeService.parseManualUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Never Gonna Give You Up');
      expect(video).not.toBeNull();
      expect(video?.videoId).toBe('dQw4w9WgXcQ');
      expect(video?.videoUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(video?.thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
      expect(video?.title).toBe('Never Gonna Give You Up');
    });
  });
});
