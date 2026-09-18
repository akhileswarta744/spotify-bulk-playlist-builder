import { describe, it, expect } from 'vitest';
import { scoreCandidate, rankCandidates } from '../src/services/matcherService';
import { SpotifyTrack } from '../src/types/spotify';
import { ParsedSong } from '../src/types';

function createMockTrack(overrides: Partial<SpotifyTrack>): SpotifyTrack {
  return {
    id: overrides.id || 'track_123',
    name: overrides.name || 'Sample Track',
    uri: overrides.uri || 'spotify:track:track_123',
    duration_ms: 210000,
    popularity: overrides.popularity !== undefined ? overrides.popularity : 70,
    preview_url: null,
    explicit: false,
    external_urls: { spotify: 'https://open.spotify.com/track/track_123' },
    artists: overrides.artists || [{ id: 'artist_1', name: 'Sample Artist', uri: 'spotify:artist:artist_1' }],
    album: overrides.album || {
      id: 'album_1',
      name: 'Sample Album',
      uri: 'spotify:album:album_1',
      images: [{ url: 'https://example.com/cover.jpg', height: 300, width: 300 }],
      release_date: '2024-01-01',
      total_tracks: 10,
    },
  };
}

describe('Matching Engine Tests', () => {
  it('gives 100 points for an exact title match', () => {
    const song: ParsedSong = {
      id: '1',
      lineNumber: 1,
      raw: 'Tu Meri',
      title: 'Tu Meri',
      isDuplicate: false,
    };
    const track = createMockTrack({ name: 'Tu Meri', popularity: 50 });
    const scored = scoreCandidate(song, track);
    expect(scored.score).toBeGreaterThanOrEqual(95);
    expect(scored.confidence).toBe('high');
    expect(scored.reasons).toContain('Exact title match');
  });

  it('normalizes formatting differences (case, punctuation, symbols)', () => {
    const song: ParsedSong = {
      id: '1',
      lineNumber: 1,
      raw: 'Tu Meri!',
      title: 'Tu Meri!',
      isDuplicate: false,
    };
    const track = createMockTrack({ name: 'tu meri', popularity: 40 });
    const scored = scoreCandidate(song, track);
    expect(scored.score).toBeGreaterThanOrEqual(85);
    expect(scored.confidence).toBe('high');
  });

  it('incorporates artist similarity when artist is specified', () => {
    const songWithArtist: ParsedSong = {
      id: '1',
      lineNumber: 1,
      raw: 'Tu Meri - Vishal Dadlani',
      title: 'Tu Meri',
      artist: 'Vishal Dadlani',
      isDuplicate: false,
    };

    const matchingTrack = createMockTrack({
      name: 'Tu Meri',
      artists: [{ id: 'a1', name: 'Vishal Dadlani', uri: 'spotify:artist:a1' }],
    });

    const mismatchingTrack = createMockTrack({
      name: 'Tu Meri',
      artists: [{ id: 'a2', name: 'Random Artist', uri: 'spotify:artist:a2' }],
    });

    const matchCandidate = scoreCandidate(songWithArtist, matchingTrack);
    const mismatchCandidate = scoreCandidate(songWithArtist, mismatchingTrack);

    expect(matchCandidate.score).toBeGreaterThan(mismatchCandidate.score);
    expect(matchCandidate.reasons.some((r) => r.includes('Exact artist match'))).toBe(true);
    expect(mismatchCandidate.reasons).toContain('Artist mismatch penalty');
  });

  it('does NOT choose a questionable result simply because of high popularity', () => {
    const song: ParsedSong = {
      id: '1',
      lineNumber: 1,
      raw: 'Tu Meri',
      title: 'Tu Meri',
      isDuplicate: false,
    };

    const accurateTrack = createMockTrack({
      id: 't1',
      name: 'Tu Meri',
      popularity: 20,
    });

    const popularIrrelevantTrack = createMockTrack({
      id: 't2',
      name: 'Completely Different Song',
      popularity: 99,
    });

    const ranked = rankCandidates(song, [popularIrrelevantTrack, accurateTrack]);
    expect(ranked.selectedTrack?.id).toBe(accurateTrack.id);
    expect(ranked.status).toBe('matched');
  });

  it('flags ambiguous multiple matches with "needs_review"', () => {
    const song: ParsedSong = {
      id: '1',
      lineNumber: 1,
      raw: 'Tu Meri',
      title: 'Tu Meri',
      isDuplicate: false,
    };

    // Two tracks with virtually identical names and close scores
    const track1 = createMockTrack({ id: 't1', name: 'Tu Meri (Original)', popularity: 60 });
    const track2 = createMockTrack({ id: 't2', name: 'Tu Meri (Club Mix)', popularity: 58 });

    const ranked = rankCandidates(song, [track1, track2]);
    expect(ranked.status).toBe('needs_review');
    expect(ranked.candidates.length).toBe(2);
  });

  it('marks empty candidate list as "not_found"', () => {
    const song: ParsedSong = {
      id: '1',
      lineNumber: 1,
      raw: 'Obscure Song',
      title: 'Obscure Song',
      isDuplicate: false,
    };

    const ranked = rankCandidates(song, []);
    expect(ranked.status).toBe('not_found');
    expect(ranked.selectedTrack).toBeUndefined();
  });
});
