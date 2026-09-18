import { describe, it, expect } from 'vitest';
import { parseSongList, DEFAULT_TEST_TRACKS } from '../src/services/normalizerService';
import { rankCandidates } from '../src/services/matcherService';
import { SpotifyTrack } from '../src/types/spotify';
import { ParsedSong, MatchResult } from '../src/types';

function createMockTrack(id: string, name: string): SpotifyTrack {
  return {
    id,
    name,
    uri: `spotify:track:${id}`,
    duration_ms: 200000,
    popularity: 75,
    preview_url: null,
    explicit: false,
    external_urls: { spotify: `https://open.spotify.com/track/${id}` },
    artists: [{ id: `art_${id}`, name: 'Artist', uri: `spotify:artist:art_${id}` }],
    album: {
      id: `alb_${id}`,
      name: 'Album',
      uri: `spotify:album:alb_${id}`,
      images: [],
      release_date: '2024',
      total_tracks: 10,
    },
  };
}

describe('Order Preservation Tests', () => {
  it('guarantees that: Tu Meri -> Badtameez Dil -> Dhan Te Nan always produces exact order: 1. Tu Meri, 2. Badtameez Dil, 3. Dhan Te Nan', () => {
    const input = `Tu Meri
Badtameez Dil
Dhan Te Nan`;

    const parsed = parseSongList(input);

    expect(parsed).toHaveLength(3);
    expect(parsed[0].title).toBe('Tu Meri');
    expect(parsed[1].title).toBe('Badtameez Dil');
    expect(parsed[2].title).toBe('Dhan Te Nan');

    // Simulate matching for each track in exact sequence
    const matchResults: MatchResult[] = parsed.map((song) => {
      const mockTrack = createMockTrack(song.id, song.title);
      return rankCandidates(song, [mockTrack]);
    });

    // Verify ordering is 100% maintained in final match results
    expect(matchResults[0].song.title).toBe('Tu Meri');
    expect(matchResults[0].selectedTrack?.name).toBe('Tu Meri');

    expect(matchResults[1].song.title).toBe('Badtameez Dil');
    expect(matchResults[1].selectedTrack?.name).toBe('Badtameez Dil');

    expect(matchResults[2].song.title).toBe('Dhan Te Nan');
    expect(matchResults[2].selectedTrack?.name).toBe('Dhan Te Nan');

    // Extract URIs to add to Spotify playlist
    const trackUris = matchResults
      .map((m) => m.selectedTrack?.uri)
      .filter((uri): uri is string => Boolean(uri));

    expect(trackUris).toEqual([
      `spotify:track:${parsed[0].id}`,
      `spotify:track:${parsed[1].id}`,
      `spotify:track:${parsed[2].id}`,
    ]);
  });

  it('preserves order of all 50 items from default playlist input', () => {
    const parsed = parseSongList(DEFAULT_TEST_TRACKS.join('\n'));

    expect(parsed).toHaveLength(50);
    for (let i = 0; i < 50; i++) {
      expect(parsed[i].title).toBe(DEFAULT_TEST_TRACKS[i]);
      expect(parsed[i].lineNumber).toBe(i + 1);
    }
  });
});
